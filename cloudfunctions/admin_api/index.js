const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function getAll(collection, options = {}) {
  const pageSize = options.pageSize || 100;
  let skip = 0;
  const data = [];

  while (true) {
    let query = collection.skip(skip).limit(pageSize);
    if (options.orderBy) {
      query = query.orderBy(options.orderBy.field, options.orderBy.direction);
    }
    const res = await query.get();
    const rows = res.data || [];
    data.push(...rows);
    if (rows.length < pageSize) break;
    skip += rows.length;
  }

  return data;
}

exports.main = async (event, context) => {
  const { token, action, payload } = event;
  const now = new Date().toISOString();

  // 1. 鉴权校验
  if (token !== ADMIN_PASSWORD) {
    return {
      code: 403,
      message: '口令验证失败，拒绝访问！'
    };
  }

  const db = cloud.database();
  const _ = db.command;

  try {
    switch (action) {
      // ==================== 1. 系统看板统计 ====================
      case 'get_stats': {
        const usersCount = await db.collection('users').count();
        const exercisesCount = await db.collection('exercises').count();
        const plansCount = await db.collection('plan_templates').count();
        const workoutsCount = await db.collection('workout_sessions').count();
        
        return {
          code: 200,
          data: {
            users: usersCount.total,
            exercises: exercisesCount.total,
            plans: plansCount.total,
            workouts: workoutsCount.total
          }
        };
      }

      // ==================== 2. 肌群字典获取 ====================
      case 'get_muscles': {
        const data = await getAll(db.collection('muscles'), {
          orderBy: { field: 'sort_order', direction: 'asc' }
        });
        return {
          code: 200,
          data
        };
      }

      case 'save_muscle': {
        const muscle = { ...(payload || {}) };
        const id = muscle._id;
        if (!id) {
          return { code: 400, message: '肌群 ID 不能为空' };
        }

        delete muscle._id;
        muscle.updated_at = now;
        if (!muscle.created_at) {
          muscle.created_at = now;
        }

        const existing = await db.collection('muscles').doc(id).get().catch(() => null);
        if (existing && existing.data) {
          await db.collection('muscles').doc(id).update({ data: muscle });
        } else {
          await db.collection('muscles').add({ data: { _id: id, ...muscle } });
        }

        const result = { _id: id, ...muscle };
        await db.collection('admin_logs').add({
          data: {
            admin_id: 'web_admin',
            action: existing && existing.data ? 'update_muscle' : 'create_muscle',
            target_collection: 'muscles',
            target_id: id,
            before: existing && existing.data ? existing.data : null,
            after: result,
            created_at: now
          }
        });

        return { code: 200, data: result };
      }

      // ==================== 3. 动作库管理 ====================
      case 'get_exercises': {
        const data = await getAll(db.collection('exercises'), {
          orderBy: { field: 'updated_at', direction: 'desc' }
        });
        return {
          code: 200,
          data
        };
      }

      case 'save_exercise': {
        const exercise = payload;
        const id = exercise._id;
        delete exercise._id; // 更新时移除主键，防报错

        exercise.updated_at = now;
        if (!exercise.created_at) {
          exercise.created_at = now;
        }

        let result;
        let beforeSnapshot = null;

        if (id) {
          // 更新已有动作
          const existing = await db.collection('exercises').doc(id).get().catch(() => null);
          if (existing && existing.data) {
            beforeSnapshot = existing.data;
            await db.collection('exercises').doc(id).update({
              data: exercise
            });
            result = { _id: id, ...exercise };
          } else {
            // id存在但在db没有，新建
            await db.collection('exercises').add({
              data: { _id: id, ...exercise }
            });
            result = { _id: id, ...exercise };
          }
        } else {
          // 无ID，自动生成
          const res = await db.collection('exercises').add({
            data: exercise
          });
          result = { _id: res._id, ...exercise };
        }

        // 记操作日志
        await db.collection('admin_logs').add({
          data: {
            admin_id: 'web_admin',
            action: id && beforeSnapshot ? 'update_exercise' : 'create_exercise',
            target_collection: 'exercises',
            target_id: id || result._id,
            before: beforeSnapshot,
            after: result,
            created_at: now
          }
        });

        return { code: 200, data: result };
      }

      case 'delete_exercise': {
        const { id } = payload;
        const existing = await db.collection('exercises').doc(id).get().catch(() => null);
        if (!existing || !existing.data) {
          return { code: 404, message: '动作不存在' };
        }

        // 物理彻底删除动作
        await db.collection('exercises').doc(id).remove();

        // 记操作日志
        await db.collection('admin_logs').add({
          data: {
            admin_id: 'web_admin',
            action: 'delete_exercise',
            target_collection: 'exercises',
            target_id: id,
            before: existing.data,
            after: null,
            created_at: now
          }
        });

        return { code: 200, message: '动作已彻底删除' };
      }

      // ==================== 4. 计划模板管理 ====================
      case 'get_plans': {
        const plans = await getAll(db.collection('plan_templates'), {
          orderBy: { field: 'updated_at', direction: 'desc' }
        });
        const days = await getAll(db.collection('plan_days'));
        const dayExercises = await getAll(db.collection('plan_day_exercises'));

        return {
          code: 200,
          data: {
            plans,
            days,
            dayExercises
          }
        };
      }

      case 'save_plan': {
        const { plan_template, plan_days, plan_day_exercises } = payload;
        if (!plan_template || !Array.isArray(plan_days) || !Array.isArray(plan_day_exercises)) {
          return { code: 400, message: '计划模板、训练日和动作编排不能为空' };
        }

        const planId = plan_template._id;
        let isNew = !planId;
        let finalPlanId = planId;

        // A. 保存官方计划主表信息
        plan_template.updated_at = now;
        if (isNew) {
          plan_template.created_at = now;
          plan_template.current_version = 1;
          plan_template.version = 1;

          const res = await db.collection('plan_templates').add({
            data: plan_template
          });
          finalPlanId = res._id;
        } else {
          delete plan_template._id;
          await db.collection('plan_templates').doc(planId).update({
            data: plan_template
          });
        }

        // 读取最新计划主记录，锁定当前版本号
        const currentPlanRes = await db.collection('plan_templates').doc(finalPlanId).get();
        const currentPlan = currentPlanRes.data;
        const version = currentPlan.current_version || 1;

        // B. 覆盖保存计划训练日列表
        // 物理清理当前版本的旧天编排，重新写入
        await db.collection('plan_days').where({
          plan_template_id: finalPlanId,
          plan_version: version
        }).remove();

        const dayIdMapping = {}; // 存储新旧 DayID 映射，用于动作编排绑定
        for (const day of plan_days) {
          const oldDayId = day._id;
          day.plan_template_id = finalPlanId;
          day.plan_version = version;
          day.created_at = day.created_at || now;
          day.updated_at = now;

          // 生成唯一的天记录 _id
          const newDayId = `${finalPlanId}_v${version}_day_${day.day_index}`;
          day._id = newDayId;
          if (oldDayId) {
            dayIdMapping[oldDayId] = newDayId;
          }

          await db.collection('plan_days').add({ data: day });
        }

        // C. 覆盖保存训练日的动作编排列表
        await db.collection('plan_day_exercises').where({
          plan_template_id: finalPlanId,
          plan_version: version
        }).remove();

        for (const ex of plan_day_exercises) {
          ex.plan_template_id = finalPlanId;
          ex.plan_version = version;
          ex.created_at = ex.created_at || now;
          ex.updated_at = now;

          // 重新绑定正确的训练日 _id (如果因为版本更新导致 Day ID 变动)
          if (dayIdMapping[ex.plan_day_id]) {
            ex.plan_day_id = dayIdMapping[ex.plan_day_id];
          }

          // 生成唯一的编排 ID
          const exId = `${ex.plan_day_id}_${String(ex.order).padStart(2, '0')}_${ex.exercise_id}`;
          ex._id = exId;

          await db.collection('plan_day_exercises').add({ data: ex });
        }

        // D. 如果发布状态为 published，生成版本快照
        if (currentPlan.status === 'published') {
          const snapshot = {
            plan_template: { ...currentPlan, _id: finalPlanId },
            plan_days: plan_days.map(d => ({ ...d, plan_template_id: finalPlanId, plan_version: version })),
            plan_day_exercises: plan_day_exercises.map(e => {
              const freshEx = { ...e, plan_template_id: finalPlanId, plan_version: version };
              if (dayIdMapping[e.plan_day_id]) {
                freshEx.plan_day_id = dayIdMapping[e.plan_day_id];
              }
              return freshEx;
            })
          };

          const versionId = `${finalPlanId}_v${version}`;
          const versionRecord = {
            _id: versionId,
            plan_template_id: finalPlanId,
            version: version,
            snapshot: snapshot,
            status: 'published',
            created_at: now,
            published_at: now
          };

          // 先删除防重，再写入
          await db.collection('plan_template_versions').doc(versionId).remove().catch(() => null);
          await db.collection('plan_template_versions').add({ data: versionRecord });
        }

        // 记操作日志
        await db.collection('admin_logs').add({
          data: {
            admin_id: 'web_admin',
            action: isNew ? 'create_plan' : 'update_plan',
            target_collection: 'plan_templates',
            target_id: finalPlanId,
            after: { plan_template: { ...currentPlan, _id: finalPlanId }, plan_days, plan_day_exercises },
            created_at: now
          }
        });

        return {
          code: 200,
          data: {
            plan_template: { ...currentPlan, _id: finalPlanId },
            plan_days,
            plan_day_exercises
          }
        };
      }

      case 'delete_plan': {
        const { id } = payload;
        const existing = await db.collection('plan_templates').doc(id).get().catch(() => null);
        if (!existing || !existing.data) {
          return { code: 404, message: '计划模板不存在' };
        }

        // 物理彻底删除计划模板
        await db.collection('plan_templates').doc(id).remove();

        // 同时彻底删除关联的版本快照与训练日/动作绑定
        await db.collection('plan_template_versions').where({
          plan_template_id: id
        }).remove().catch(() => {});

        await db.collection('plan_days').where({
          plan_template_id: id
        }).remove().catch(() => {});

        await db.collection('plan_day_exercises').where({
          plan_template_id: id
        }).remove().catch(() => {});

        // 记日志
        await db.collection('admin_logs').add({
          data: {
            admin_id: 'web_admin',
            action: 'delete_plan',
            target_collection: 'plan_templates',
            target_id: id,
            before: existing.data,
            after: null,
            created_at: now
          }
        });

        return { code: 200, message: '计划及全部关联数据已彻底删除' };
      }

      case 'publish_plan_new_version': {
        const { id } = payload;
        const currentPlanRes = await db.collection('plan_templates').doc(id).get().catch(() => null);
        if (!currentPlanRes || !currentPlanRes.data) {
          return { code: 404, message: '计划不存在' };
        }

        const currentPlan = currentPlanRes.data;
        const oldVersion = currentPlan.current_version || 1;
        const newVersion = oldVersion + 1;

        // 1. 更新计划模板主表版本号与状态
        await db.collection('plan_templates').doc(id).update({
          data: {
            current_version: newVersion,
            version: newVersion,
            status: 'published',
            updated_at: now
          }
        });

        // 2. 复制老训练日与编排到新版本下
        const oldDays = await db.collection('plan_days').where({
          plan_template_id: id,
          plan_version: oldVersion
        }).get();

        const dayIdMapping = {};
        for (const day of oldDays.data) {
          const oldDayId = day._id;
          const newDay = { ...day, plan_version: newVersion, updated_at: now };
          const newDayId = `${id}_v${newVersion}_day_${day.day_index}`;
          newDay._id = newDayId;
          dayIdMapping[oldDayId] = newDayId;

          await db.collection('plan_days').add({ data: newDay });

          // 复制老编排
          const oldExs = await db.collection('plan_day_exercises').where({
            plan_day_id: oldDayId
          }).get();

          for (const ex of oldExs.data) {
            const newEx = { ...ex, plan_version: newVersion, plan_day_id: newDayId, updated_at: now };
            newEx._id = `${newDayId}_${String(ex.order).padStart(2, '0')}_${ex.exercise_id}`;
            await db.collection('plan_day_exercises').add({ data: newEx });
          }
        }

        // 3. 构建新的版本快照
        const freshDays = await db.collection('plan_days').where({
          plan_template_id: id,
          plan_version: newVersion
        }).get();

        const freshExs = await db.collection('plan_day_exercises').where({
          plan_template_id: id,
          plan_version: newVersion
        }).get();

        const snapshot = {
          plan_template: { ...currentPlan, _id: id, current_version: newVersion, version: newVersion, status: 'published' },
          plan_days: freshDays.data,
          plan_day_exercises: freshExs.data
        };

        const versionId = `${id}_v${newVersion}`;
        const versionRecord = {
          _id: versionId,
          plan_template_id: id,
          version: newVersion,
          snapshot: snapshot,
          status: 'published',
          created_at: now,
          published_at: now
        };

        await db.collection('plan_template_versions').add({ data: versionRecord });

        // 记操作日志
        await db.collection('admin_logs').add({
          data: {
            admin_id: 'web_admin',
            action: 'publish_new_version',
            target_collection: 'plan_templates',
            target_id: id,
            after: { version: newVersion },
            created_at: now
          }
        });

        return {
          code: 200,
          data: { new_version: newVersion }
        };
      }

      // ==================== 5. 建议留言管理 ====================
      case 'get_feedback_messages': {
        const res = await db.collection('feedback_messages')
          .orderBy('created_at', 'desc')
          .limit(200)
          .get();
        return {
          code: 200,
          data: res.data
        };
      }

      case 'update_feedback_status': {
        const { id, status } = payload;
        if (!id || !['new', 'processing', 'done'].includes(status)) {
          return { code: 400, message: '留言状态参数不正确' };
        }

        const existing = await db.collection('feedback_messages').doc(id).get().catch(() => null);
        if (!existing || !existing.data) {
          return { code: 404, message: '留言不存在' };
        }

        await db.collection('feedback_messages').doc(id).update({
          data: {
            status,
            updated_at: now
          }
        });

        await db.collection('admin_logs').add({
          data: {
            admin_id: 'web_admin',
            action: 'update_feedback_status',
            target_collection: 'feedback_messages',
            target_id: id,
            before: existing.data,
            after: { ...existing.data, status, updated_at: now },
            created_at: now
          }
        });

        return {
          code: 200,
          data: { _id: id, status, updated_at: now }
        };
      }

      default:
        return {
          code: 400,
          message: '未知的接口操作动作！'
        };
    }
  } catch (err) {
    return {
      code: 500,
      message: '云函数内部执行出错: ' + err.toString()
    };
  }
};
