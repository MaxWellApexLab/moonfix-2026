from pathlib import Path
import json
import subprocess
import pytest
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT/'index.html').read_text(encoding='utf8')


@pytest.fixture(scope='module')
def browser():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox','--disable-dev-shm-usage'])
        yield browser
        browser.close()


@pytest.fixture
def page(browser):
    page = browser.new_page(viewport={'width': 1440, 'height': 900}, accept_downloads=True)
    page.set_content(HTML, wait_until='load')
    yield page
    page.close()


def test_boot_with_no_script_errors(browser):
    p = browser.new_page()
    errors = []
    p.on('pageerror', lambda e: errors.append(str(e)))
    p.set_content(HTML, wait_until='load')
    assert not errors
    assert p.title() == 'MoonFix — Lunar Mission Window Navigator'
    assert p.locator('#rankRows tr').count() == 10
    p.close()


def test_initial_science_values(page):
    assert page.locator('#metricEligible').inner_text() == '2 / 10'
    assert page.locator('#metricPrimaryCount').inner_text() == '45/72'
    assert page.locator('#metricBestRun').inner_text() == '44.0h'
    assert page.locator('#windowList .window-pill').count() >= 1


def test_time_clipping_and_presets(page):
    page.locator('[data-preset="1"]').click()
    assert page.locator('#startEpoch').input_value() == '24'
    assert page.locator('#endEpoch').input_value() == '47'
    assert page.locator('#metricCoverage').inner_text() == '23h'
    page.locator('#startEpoch').select_option('46')
    page.locator('#endEpoch').select_option('50')
    assert page.locator('#metricCoverage').inner_text() == '4h'
    assert page.locator('#metricPrimaryCount').inner_text().endswith('/5')


def test_tighter_filters_reduce_eligibility(page):
    page.locator('#minRun').select_option('24')
    page.locator('#maxSlope').select_option('15')
    assert page.locator('#metricEligible').inner_text() == '0 / 10'
    page.locator('#maxSlope').select_option('99')
    assert page.locator('#metricEligible').inner_text() == '1 / 10'


def test_site_and_comparison_are_independent(page):
    page.locator('#primarySite').select_option('South_83E60')
    assert '83E60' in page.locator('#siteName').inner_text()
    assert page.locator('#metricPrimaryCount').inner_text() == '17/72'
    assert page.locator('.track').count() == 2
    page.locator('#compareSite').select_option('South_84E0')
    assert '84E0' in page.locator('.track').last.inner_text()


def test_heatmap_click_updates_hour(page):
    page.locator('#comparisonTracks [data-epoch="49"]').first.click()
    assert page.locator('#epochSlider').input_value() == '49'
    assert '11/16' in page.locator('#epochCurrent').inner_text()


def test_graph_click_updates_hour(page):
    page.locator('#clearanceGraph [data-epoch="15"]').click(force=True)
    assert page.locator('#epochSlider').input_value() == '15'


def test_rank_table_updates_selected_site(page):
    page.locator('[data-rank-site="South_83E60"]').click()
    assert '83E60' in page.locator('#siteName').inner_text()


def test_csv_exports(page):
    with page.expect_download() as d:
        page.locator('#exportRank').click()
    download = d.value
    assert download.suggested_filename == 'moonfix_site_ranking.csv'
    path = download.path()
    assert 'South_84E40' in Path(path).read_text()
    with page.expect_download() as d2:
        page.locator('#exportWindows').click()
    assert '_windows.csv' in d2.value.suggested_filename


def test_share_view_and_reset(page):
    page.locator('#margin').fill('2')
    page.locator('#startEpoch').select_option('17')
    page.locator('#shareView').click()
    page.wait_for_timeout(100)
    assert '#view=' in page.url
    page.locator('#resetControls').click()
    assert page.locator('#marginValue').inner_text() == '+1.0°'
    assert page.locator('#startEpoch').input_value() == '0'


def test_mobile_no_horizontal_body_overflow(browser):
    mobile = browser.new_page(viewport={'width': 390, 'height': 844})
    errors=[]
    mobile.on('pageerror',lambda e:errors.append(str(e)))
    mobile.set_content(HTML, wait_until='load')
    assert not errors
    assert mobile.evaluate('document.body.scrollWidth <= window.innerWidth')
    assert mobile.locator('#rankRows tr').count()==10
    mobile.close()


def test_build_is_deterministic():
    before=(ROOT/'index.html').read_bytes()
    subprocess.run(['python',str(ROOT/'scripts/build.py')],check=True,capture_output=True)
    assert (ROOT/'index.html').read_bytes()==before


def test_reference_input_self_consistent():
    d=json.loads((ROOT/'data/mission_samples.json').read_text())
    assert len(d['sites'])==10
    assert sum(len(s['samples']) for s in d['sites'])==720
    assert d['timeScale']=='TDB'
