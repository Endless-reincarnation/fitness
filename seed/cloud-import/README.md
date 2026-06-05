# 云数据库导入说明

这些文件由 `tools/build-cloud-seed.js` 从 `seed/*.seed.json` 生成，作为微信云数据库初始化数据。

## 导入顺序

1. `muscles.json` 导入集合 `muscles`
2. `exercises.json` 导入集合 `exercises`
3. `plan_templates.json` 导入集合 `plan_templates`
4. `plan_template_versions.json` 导入集合 `plan_template_versions`
5. `plan_days.json` 导入集合 `plan_days`
6. `plan_day_exercises.json` 导入集合 `plan_day_exercises`
7. `exercise_alternatives.json` 导入集合 `exercise_alternatives`

## 生成命令

```bash
node tools/build-cloud-seed.js
```

## 注意事项

- 这些文件是生成物，新增计划或动作时优先修改 `seed/*.seed.json`，再重新生成。
- 云数据库导入时保留 `_id`，方便小程序端稳定引用动作和计划。
- 当前计划状态仍是 `draft`，正式上线前需要在后台或数据库里改为 `published`。
- `manifest.json` 只用于核对数量，不需要导入云数据库集合。
