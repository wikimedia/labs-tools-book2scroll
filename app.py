from flask import Flask, render_template, request, jsonify
import toolforge
from phpserialize import loads, phpobject
from flask_cors import CORS

app = Flask(__name__)
cors = CORS(app)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/read/<string:lang>/<string:book>')
def readbook(lang, book):
    return render_template('read.html')


@app.route('/api/getbooks')
def getbooks():
    lang = request.args.get("lang")
    ns = request.args.get("ns")
    data = {}

    if not lang or not ns:
        return jsonify({"error": "Did not find lang or namespace :("})

    conn = toolforge.connect(lang + 'wikisource_p')
    q_s = 'select page_title, image.img_metadata from page' + \
        ' LEFT JOIN image ON page.page_title = image.img_name where page_namespace={ns};'
    q = q_s.format(ns=ns)
    with conn.cursor() as cur:
        cur.execute(q)
        rows = cur.fetchall()
        for row in rows:
            try:
                d = loads(row[1], object_hook=phpobject)
                new_data = {key.decode("utf-8"): val for key, val in d.items()}
                pn = new_data["Pages"].decode("utf-8")
            except Exception:
                pn = '-'
            data[row[0].decode("utf-8")] = str(pn)

    return jsonify(data)


if __name__ == "__main__":
    app.run()
