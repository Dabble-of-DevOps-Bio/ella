import threading
import os
import sys
import logging
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from flask import send_from_directory, request
from api import app, db
from api.v1 import ApiV1

from vardb.deposit.deposit_testdata import DepositTestdata

SCRIPT_DIR = os.path.abspath(os.path.dirname(__file__))

PROD_STATIC_FILE_DIR = os.path.join(SCRIPT_DIR, '../webui/prod')
DEV_STATIC_FILE_DIR = os.path.join(SCRIPT_DIR, '../webui/dev')

log = app.logger


@app.before_first_request
def setup_logging():
    if not app.debug:
        log.addHandler(logging.StreamHandler())
        log.setLevel(logging.INFO)


@app.before_request
def before_request():
    if request.method in ['PUT', 'POST', 'DELETE']:
        log.warning(" {method} - {endpoint} - {json}".format(
            method=request.method,
            endpoint=request.url,
            json=request.get_json()
            )
        )


@app.teardown_appcontext
def shutdown_session(exception=None):
    db.session.remove()


def serve_static_factory(dev=False):
    static_path = PROD_STATIC_FILE_DIR
    if dev:
        static_path = DEV_STATIC_FILE_DIR

    def serve_static(path=None):
        if not path:
            path = 'index.html'

        valid_files = [
            'app.css',
            'app.js',
            'thirdparty.js',
            'fonts',
            'ngtmpl'
        ]

        if not any(v == path or path.startswith(v) for v in valid_files):
            path = 'index.html'

        return send_from_directory(static_path,
                                   path)

    return serve_static


# TODO: !!!!!!!!!!Remove before production!!!!!!!!!
@app.route('/reset')
def reset_testdata():
    test_set = 'small' if not request.args.get('all') in ['True', 'true'] else 'large'

    def worker():
        dt = DepositTestdata(db)
        dt.deposit_all(test_set=test_set)

    t = threading.Thread(target=worker)
    t.start()

    return "Test database is resetting. It should be ready in a minute."


def init_v1(app):
    v1 = ApiV1()
    v1.init_app(app)

init_v1(app)

# This is used by development and medicloud - production will not trigger it
if __name__ == '__main__':
    opts = {}
    opts['host'] = '0.0.0.0'
    opts['threaded'] = True
    is_dev = os.getenv('DEVELOP', False)

    if is_dev:
        opts['debug'] = is_dev
    else:
        opts['port'] = int(os.getenv('VCAP_APP_PORT', '5000')) # medicloud bullshit
    app.add_url_rule('/', 'index', serve_static_factory(dev=is_dev))
    app.add_url_rule('/<path:path>', 'index_redirect', serve_static_factory(dev=is_dev))
    app.run(**opts)
