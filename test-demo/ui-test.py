from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://127.0.0.1:8081/')
        page.wait_for_load_state('networkidle')

        # Click project management
        page.click("text=项目管理")
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        
        # Take screenshot of project page
        page.screenshot(path='/workspace/test-demo/projects.png')

        # Click create project
        page.click("text=新建项目")
        page.wait_for_selector(".el-dialog")
        
        # Fill form
        page.fill("input[placeholder='如: e-commerce']", "playwright-project")
        page.fill("input[placeholder='如: 电商业务线']", "Playwright Test Project")
        page.fill("textarea", "Created by automation test")
        
        # Submit
        page.click("text=确认")
        page.wait_for_timeout(1000)
        
        # Take screenshot after create
        page.screenshot(path='/workspace/test-demo/projects_after.png')

        browser.close()

if __name__ == '__main__':
    run()
