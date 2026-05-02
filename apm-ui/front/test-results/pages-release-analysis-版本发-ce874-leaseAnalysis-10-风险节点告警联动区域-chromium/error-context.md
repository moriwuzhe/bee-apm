# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pages\release-analysis.spec.ts >> 版本发布与影响分析 - ReleaseAnalysis >> 10. 风险节点告警联动区域
- Location: tests\pages\release-analysis.spec.ts:91:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  getByText('查看全部告警').first()
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('查看全部告警').first()
    9 × locator resolved to <button class="text-xs">查看全部告警</button>
      - unexpected value "hidden"

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - img [ref=e7]
        - generic [ref=e9]:
          - generic [ref=e10]: OpsWatch
          - generic [ref=e11]: 运维监控平台
      - generic [ref=e12]:
        - generic [ref=e13]:
          - button "监控运维" [ref=e14] [cursor=pointer]:
            - generic [ref=e15]: 监控运维
            - img [ref=e16]
          - generic [ref=e18]:
            - button "监控大盘" [ref=e19] [cursor=pointer]:
              - img [ref=e21]
              - generic [ref=e26]: 监控大盘
            - button "项目管理" [ref=e27] [cursor=pointer]:
              - img [ref=e29]
              - generic [ref=e31]: 项目管理
            - button "应用管理" [ref=e32] [cursor=pointer]:
              - img [ref=e34]
              - generic [ref=e36]: 应用管理
            - button "Agent管控" [ref=e37] [cursor=pointer]:
              - img [ref=e39]
              - generic [ref=e42]: Agent管控
            - button "主机&JVM监控" [ref=e43] [cursor=pointer]:
              - img [ref=e45]
              - generic [ref=e47]: 主机&JVM监控
            - button "网络拓扑" [ref=e48] [cursor=pointer]:
              - img [ref=e50]
              - generic [ref=e55]: 网络拓扑
            - button "服务依赖" [ref=e56] [cursor=pointer]:
              - img [ref=e58]
              - generic [ref=e62]: 服务依赖
            - button "版本发布" [ref=e63] [cursor=pointer]:
              - img [ref=e65]
              - generic [ref=e69]: 版本发布
            - button "告警规则" [ref=e70] [cursor=pointer]:
              - img [ref=e72]
              - generic [ref=e75]: 告警规则
        - generic [ref=e76]:
          - button "权限管控" [ref=e77] [cursor=pointer]:
            - generic [ref=e78]: 权限管控
            - img [ref=e79]
          - generic [ref=e81]:
            - button "用户管理" [ref=e82] [cursor=pointer]:
              - img [ref=e84]
              - generic [ref=e89]: 用户管理
            - button "角色管理" [ref=e90] [cursor=pointer]:
              - img [ref=e92]
              - generic [ref=e94]: 角色管理
            - button "权限管理" [ref=e95] [cursor=pointer]:
              - img [ref=e97]
              - generic [ref=e101]: 权限管理
      - button "收起" [ref=e103] [cursor=pointer]:
        - img [ref=e104]
        - generic [ref=e106]: 收起
    - generic [ref=e107]:
      - generic [ref=e108]:
        - generic [ref=e109]:
          - generic [ref=e110]: OpsWatch
          - generic [ref=e111]: /
          - generic [ref=e112]: 发布影响分析
        - generic [ref=e113]:
          - img [ref=e114]
          - textbox "搜索应用、主机、告警..." [ref=e117]
          - generic [ref=e118]: ⌘K
        - button "3" [ref=e120] [cursor=pointer]:
          - img [ref=e121]
          - generic [ref=e124]: "3"
        - button [ref=e125] [cursor=pointer]:
          - img [ref=e126]
        - button "A admin" [ref=e130] [cursor=pointer]:
          - generic [ref=e131]: A
          - generic [ref=e132]: admin
          - img [ref=e133]
      - generic [ref=e136]:
        - generic [ref=e137]:
          - generic [ref=e138]:
            - heading "发布影响分析" [level=1] [ref=e139]
            - paragraph [ref=e140]: 5 个版本 · 7 条活跃告警 · 2 处高风险变更
          - generic [ref=e141]:
            - generic [ref=e142]:
              - button "全部" [ref=e143] [cursor=pointer]
              - button "新增" [ref=e144] [cursor=pointer]
              - button "修改" [ref=e145] [cursor=pointer]
              - button "删除" [ref=e146] [cursor=pointer]
            - button "导出报告" [ref=e147] [cursor=pointer]:
              - img [ref=e149]
              - generic [ref=e151]: 导出报告
        - generic [ref=e152]:
          - generic [ref=e153]:
            - generic [ref=e154]: 版本发布数
            - generic [ref=e155]: "5"
          - generic [ref=e156]:
            - generic [ref=e157]: 高风险变更
            - generic [ref=e158]: "2"
          - generic [ref=e159]:
            - generic [ref=e160]: 受影响服务
            - generic [ref=e161]: "11"
          - generic [ref=e162]:
            - generic [ref=e163]: 活跃告警数
            - generic [ref=e164]: "7"
        - generic [ref=e165]:
          - generic [ref=e166]:
            - generic [ref=e167]:
              - img [ref=e168]
              - generic [ref=e172]: 变更热力图
              - generic [ref=e173]: 悬停查看详情 · 点击进入变更
            - generic [ref=e174]:
              - generic [ref=e177]: 高风险
              - generic [ref=e180]: 中风险
              - generic [ref=e183]: 低风险
          - generic [ref=e185]:
            - generic [ref=e186]:
              - generic [ref=e187]: order-service
              - generic [ref=e188]:
                - generic [ref=e189] [cursor=pointer]:
                  - generic [ref=e190]:
                    - generic [ref=e191]: "8"
                    - generic [ref=e192]: 修改
                  - generic [ref=e193]: 高
                - generic [ref=e194] [cursor=pointer]:
                  - generic [ref=e195]:
                    - generic [ref=e196]: "3"
                    - generic [ref=e197]: 新增
                  - generic [ref=e198]: 低
            - generic [ref=e199]:
              - generic [ref=e200]: payment-gateway
              - generic [ref=e201]:
                - generic [ref=e202] [cursor=pointer]:
                  - generic [ref=e203]:
                    - generic [ref=e204]: "5"
                    - generic [ref=e205]: 修改
                  - generic [ref=e206]: 中
                - generic [ref=e207] [cursor=pointer]:
                  - generic [ref=e208]:
                    - generic [ref=e209]: "2"
                    - generic [ref=e210]: 新增
                  - generic [ref=e211]: 低
            - generic [ref=e212]:
              - generic [ref=e213]: user-service
              - generic [ref=e214]:
                - generic [ref=e215] [cursor=pointer]:
                  - generic [ref=e216]:
                    - generic [ref=e217]: "4"
                    - generic [ref=e218]: 修改
                  - generic [ref=e219]: 中
                - generic [ref=e220] [cursor=pointer]:
                  - generic [ref=e221]:
                    - generic [ref=e222]: "1"
                    - generic [ref=e223]: 删除
                  - generic [ref=e224]: 低
            - generic [ref=e225]:
              - generic [ref=e226]: inventory
              - generic [ref=e227]:
                - generic [ref=e228] [cursor=pointer]:
                  - generic [ref=e229]:
                    - generic [ref=e230]: "6"
                    - generic [ref=e231]: 新增
                  - generic [ref=e232]: 中
                - generic [ref=e233] [cursor=pointer]:
                  - generic [ref=e234]:
                    - generic [ref=e235]: "2"
                    - generic [ref=e236]: 修改
                  - generic [ref=e237]: 低
            - generic [ref=e238]:
              - generic [ref=e239]: search-service
              - generic [ref=e240]:
                - generic [ref=e241] [cursor=pointer]:
                  - generic [ref=e242]:
                    - generic [ref=e243]: "9"
                    - generic [ref=e244]: 修改
                  - generic [ref=e245]: 高
                - generic [ref=e246] [cursor=pointer]:
                  - generic [ref=e247]:
                    - generic [ref=e248]: "3"
                    - generic [ref=e249]: 新增
                  - generic [ref=e250]: 低
            - generic [ref=e251]:
              - generic [ref=e252]: notify-service
              - generic [ref=e253]:
                - generic [ref=e254] [cursor=pointer]:
                  - generic [ref=e255]:
                    - generic [ref=e256]: "1"
                    - generic [ref=e257]: 新增
                  - generic [ref=e258]: 低
                - generic [ref=e259] [cursor=pointer]:
                  - generic [ref=e260]:
                    - generic [ref=e261]: "2"
                    - generic [ref=e262]: 修改
                  - generic [ref=e263]: 低
        - generic [ref=e264]:
          - generic [ref=e265]:
            - generic [ref=e266]:
              - generic [ref=e267]: 版本列表
              - generic [ref=e268]: 点击版本高亮影响节点
            - generic [ref=e269]:
              - generic [ref=e271] [cursor=pointer]: 全部版本
              - generic [ref=e272] [cursor=pointer]:
                - generic [ref=e274]: order-service
                - generic [ref=e275]: v3.2.1
                - generic [ref=e276]: 01-15 14:23
                - generic [ref=e278]: 修改
              - generic [ref=e279] [cursor=pointer]:
                - generic [ref=e281]: payment-gateway
                - generic [ref=e282]: v2.0.5
                - generic [ref=e283]: 01-15 10:15
                - generic [ref=e284]:
                  - generic [ref=e285]: 修改
                  - generic [ref=e286]: 新增
              - generic [ref=e287] [cursor=pointer]:
                - generic [ref=e289]: user-service
                - generic [ref=e290]: v1.8.2
                - generic [ref=e291]: 01-14 16:40
                - generic [ref=e293]: 修改
              - generic [ref=e294] [cursor=pointer]:
                - generic [ref=e296]: inventory
                - generic [ref=e297]: v2.3.0
                - generic [ref=e298]: 01-14 09:00
                - generic [ref=e300]: 新增
              - generic [ref=e301] [cursor=pointer]:
                - generic [ref=e303]: search-service
                - generic [ref=e304]: v1.5.0
                - generic [ref=e305]: 01-13 11:30
                - generic [ref=e306]:
                  - generic [ref=e307]: 修改
                  - generic [ref=e308]: 新增
          - generic [ref=e309]:
            - generic [ref=e311]: 影响链路图
            - generic [ref=e312]:
              - button [ref=e313] [cursor=pointer]:
                - img [ref=e314]
              - button [ref=e317] [cursor=pointer]:
                - img [ref=e318]
              - button [ref=e321] [cursor=pointer]:
                - img [ref=e322]
            - generic [ref=e325]:
              - generic [ref=e328]: 高风险
              - generic [ref=e331]: 中风险
              - generic [ref=e334]: 正常
              - generic [ref=e335]:
                - img [ref=e336]
                - generic [ref=e339]: 右键锁定节点
            - img [ref=e340]:
              - generic [ref=e342]:
                - generic [ref=e345]: REST
                - generic [ref=e348]: REST
                - generic [ref=e351]: REST
                - generic [ref=e354]: REST
                - generic [ref=e356]: MQ
                - generic [ref=e359]: SQL
                - generic [ref=e361]: SQL
                - generic [ref=e363]: SQL
                - generic [ref=e366]: Cache
                - generic [ref=e368]: Cache
                - generic [ref=e371]: Index
                - generic [ref=e374]: Event
                - generic [ref=e376]: Log
                - generic [ref=e377] [cursor=pointer]:
                  - generic [ref=e379]: GW
                  - generic [ref=e380]: API网关
                - generic [ref=e381] [cursor=pointer]:
                  - generic [ref=e384]: SVC
                  - generic [ref=e385]: 订单服务
                  - generic [ref=e388]: "2"
                - generic [ref=e389] [cursor=pointer]:
                  - generic [ref=e391]: SVC
                  - generic [ref=e392]: 支付服务
                  - generic [ref=e395]: "1"
                - generic [ref=e396] [cursor=pointer]:
                  - generic [ref=e398]: SVC
                  - generic [ref=e399]: 用户服务
                  - generic [ref=e402]: "1"
                - generic [ref=e403] [cursor=pointer]:
                  - generic [ref=e405]: SVC
                  - generic [ref=e406]: 库存服务
                - generic [ref=e407] [cursor=pointer]:
                  - generic [ref=e409]: MQ
                  - generic [ref=e410]: 消息队列
                - generic [ref=e411] [cursor=pointer]:
                  - generic [ref=e414]: DB
                  - generic [ref=e415]: 订单DB
                  - generic [ref=e418]: "2"
                - generic [ref=e419] [cursor=pointer]:
                  - generic [ref=e421]: DB
                  - generic [ref=e422]: 用户DB
                - generic [ref=e423] [cursor=pointer]:
                  - generic [ref=e425]: DB
                  - generic [ref=e426]: Redis
                - generic [ref=e427] [cursor=pointer]:
                  - generic [ref=e429]: DB
                  - generic [ref=e430]: ES
                  - generic [ref=e433]: "1"
                - generic [ref=e434] [cursor=pointer]:
                  - generic [ref=e436]: SVC
                  - generic [ref=e437]: 通知服务
        - generic [ref=e438]:
          - generic [ref=e439]:
            - generic [ref=e440]:
              - img [ref=e441]
              - generic [ref=e444]: 风险节点告警联动
              - generic [ref=e445]: 7 条活跃
            - button "查看全部告警" [ref=e446] [cursor=pointer]:
              - generic [ref=e447]: 查看全部告警
          - generic [ref=e448]:
            - generic [ref=e449] [cursor=pointer]:
              - generic [ref=e450]:
                - img [ref=e451]
                - generic [ref=e453]: 订单服务
                - generic [ref=e454]: 高
              - generic [ref=e455]: CPU使用率 > 90%
              - generic [ref=e456]: 5分钟前
            - generic [ref=e457] [cursor=pointer]:
              - generic [ref=e458]:
                - img [ref=e459]
                - generic [ref=e461]: 订单服务
                - generic [ref=e462]: 高
              - generic [ref=e463]: 接口超时 > 500ms
              - generic [ref=e464]: 3分钟前
            - generic [ref=e465] [cursor=pointer]:
              - generic [ref=e466]:
                - img [ref=e467]
                - generic [ref=e469]: 支付服务
                - generic [ref=e470]: 中
              - generic [ref=e471]: 错误率 > 5%
              - generic [ref=e472]: 18分钟前
            - generic [ref=e473] [cursor=pointer]:
              - generic [ref=e474]:
                - img [ref=e475]
                - generic [ref=e477]: 用户服务
                - generic [ref=e478]: 中
              - generic [ref=e479]: 响应延迟告警
              - generic [ref=e480]: 45分钟前
            - generic [ref=e481] [cursor=pointer]:
              - generic [ref=e482]:
                - img [ref=e483]
                - generic [ref=e485]: 订单DB
                - generic [ref=e486]: 高
              - generic [ref=e487]: 慢查询告警 > 45ms
              - generic [ref=e488]: 2分钟前
            - generic [ref=e489] [cursor=pointer]:
              - generic [ref=e490]:
                - img [ref=e491]
                - generic [ref=e493]: 订单DB
                - generic [ref=e494]: 高
              - generic [ref=e495]: 连接数超限
              - generic [ref=e496]: 1分钟前
            - generic [ref=e497] [cursor=pointer]:
              - generic [ref=e498]:
                - img [ref=e499]
                - generic [ref=e501]: ES
                - generic [ref=e502]: 中
              - generic [ref=e503]: 索引延迟 > 200ms
              - generic [ref=e504]: 20分钟前
  - region "Notifications alt+T"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { mockApiCalls } from '../setup';
  3   | 
  4   | test.describe('版本发布与影响分析 - ReleaseAnalysis', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await mockApiCalls(page);
  7   |   });
  8   | 
  9   |   test('1. 页面基本加载', async ({ page }) => {
  10  |     await page.goto('/release-analysis');
  11  |     await page.waitForLoadState('networkidle');
  12  | 
  13  |     const title = page.getByRole('heading', { name: '发布影响分析' });
  14  |     await expect(title).toBeVisible();
  15  |   });
  16  | 
  17  |   test('2. 统计卡片显示', async ({ page }) => {
  18  |     await page.goto('/release-analysis');
  19  |     await page.waitForLoadState('networkidle');
  20  | 
  21  |     await expect(page.locator('text=版本发布数')).toBeVisible();
  22  |     await expect(page.getByText('高风险变更', { exact: true })).toBeVisible();
  23  |     await expect(page.locator('text=受影响服务')).toBeVisible();
  24  |     await expect(page.locator('text=活跃告警数')).toBeVisible();
  25  |   });
  26  | 
  27  |   test('3. 变更类型筛选', async ({ page }) => {
  28  |     await page.goto('/release-analysis');
  29  |     await page.waitForLoadState('networkidle');
  30  | 
  31  |     const addButton = page.getByRole('button', { name: '新增', exact: true });
  32  |     await expect(addButton).toBeVisible();
  33  | 
  34  |     const modifyButton = page.getByRole('button', { name: '修改', exact: true });
  35  |     await expect(modifyButton).toBeVisible();
  36  | 
  37  |     const deleteButton = page.getByRole('button', { name: '删除', exact: true });
  38  |     await expect(deleteButton).toBeVisible();
  39  |   });
  40  | 
  41  |   test('4. 导出报告按钮', async ({ page }) => {
  42  |     await page.goto('/release-analysis');
  43  |     await page.waitForLoadState('networkidle');
  44  | 
  45  |     const exportButton = page.locator('button', { hasText: '导出报告' });
  46  |     await expect(exportButton).toBeVisible();
  47  |     await exportButton.click();
  48  |   });
  49  | 
  50  |   test('5. 热力图区域显示', async ({ page }) => {
  51  |     await page.goto('/release-analysis');
  52  |     await page.waitForLoadState('networkidle');
  53  | 
  54  |     await expect(page.locator('text=变更热力图')).toBeVisible();
  55  |   });
  56  | 
  57  |   test('6. 版本列表显示', async ({ page }) => {
  58  |     await page.goto('/release-analysis');
  59  |     await page.waitForLoadState('networkidle');
  60  | 
  61  |     await expect(page.locator('text=版本列表')).toBeVisible();
  62  |     await expect(page.locator('text=全部版本')).toBeVisible();
  63  |   });
  64  | 
  65  |   test('7. 版本列表点击选择', async ({ page }) => {
  66  |     await page.goto('/release-analysis');
  67  |     await page.waitForLoadState('networkidle');
  68  | 
  69  |     const firstVersion = page.locator('.space-y-2 >> .px-3 >> .text-xs >> text=order-service').first();
  70  |     if (await firstVersion.isVisible()) {
  71  |       await firstVersion.click();
  72  |     }
  73  |   });
  74  | 
  75  |   test('8. 影响链路图显示', async ({ page }) => {
  76  |     await page.goto('/release-analysis');
  77  |     await page.waitForLoadState('networkidle');
  78  | 
  79  |     await expect(page.locator('text=影响链路图')).toBeVisible();
  80  |   });
  81  | 
  82  |   test('9. 链路图缩放功能', async ({ page }) => {
  83  |     await page.goto('/release-analysis');
  84  |     await page.waitForLoadState('networkidle');
  85  | 
  86  |     const zoomInButton = page.locator('button').filter({ has: page.locator('svg') }).nth(0);
  87  |     await zoomInButton.click();
  88  |     await zoomInButton.click();
  89  |   });
  90  | 
  91  |   test('10. 风险节点告警联动区域', async ({ page }) => {
  92  |     await page.goto('/release-analysis');
  93  |     await page.waitForLoadState('networkidle');
  94  | 
  95  |     await expect(page.locator('text=风险节点告警联动')).toBeVisible();
> 96  |     await expect(page.getByText('查看全部告警').first()).toBeVisible();
      |                                                    ^ Error: expect(locator).toBeVisible() failed
  97  |   });
  98  | 
  99  |   test('11. 告警卡片显示', async ({ page }) => {
  100 |     await page.goto('/release-analysis');
  101 |     await page.waitForLoadState('networkidle');
  102 | 
  103 |     const alertCards = page.locator('.rounded-lg').filter({ hasText: '分钟前' });
  104 |     const count = await alertCards.count();
  105 |     expect(count).toBeGreaterThan(0);
  106 |   });
  107 | 
  108 |   test('12. 页面URL正确', async ({ page }) => {
  109 |     await page.goto('/release-analysis');
  110 |     await expect(page).toHaveURL(/\/release-analysis/);
  111 |   });
  112 | 
  113 |   test('13. 无JavaScript错误', async ({ page }) => {
  114 |     const errors: string[] = [];
  115 |     page.on('pageerror', error => {
  116 |       errors.push(error.message);
  117 |     });
  118 | 
  119 |     await page.goto('/release-analysis');
  120 |     await page.waitForLoadState('networkidle');
  121 |     await page.waitForTimeout(2000);
  122 | 
  123 |     expect(errors.filter(e => !e.includes('Warning'))).toHaveLength(0);
  124 |   });
  125 | 
  126 |   test('14. 响应式布局 - 桌面', async ({ page }) => {
  127 |     await page.setViewportSize({ width: 1920, height: 1080 });
  128 |     await page.goto('/release-analysis');
  129 |     await page.waitForLoadState('networkidle');
  130 |     await expect(page.locator('[data-cmp="ReleaseAnalysis"]')).toBeVisible();
  131 |   });
  132 | 
  133 |   test('15. 响应式布局 - 平板', async ({ page }) => {
  134 |     await page.setViewportSize({ width: 768, height: 1024 });
  135 |     await page.goto('/release-analysis');
  136 |     await page.waitForLoadState('networkidle');
  137 |     await expect(page.locator('[data-cmp="ReleaseAnalysis"]')).toBeVisible();
  138 |   });
  139 | });
```