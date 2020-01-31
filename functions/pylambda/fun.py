import flask


def handler(event, context):
    app = flask.Flask(__name__)

    app.config.from_object(__name__)
    print("THIS IS AN EVENT")
    print(event)
    return
