from dp.phonemizer import Phonemizer
from flask import Flask
from flask import request

phonemizer = Phonemizer.from_checkpoint('assets/model.pt')
app = Flask(__name__, instance_relative_config=True)

@app.route('/')
def handle():
    """
    Simple route that handles the phonem to grapheme translation.
    """
    grapheme = request.args.get('grapheme')
    if grapheme is None:
        return "You are missing the 'grapheme' parameter", 400
    lang = request.args.get('language')
    if lang is None:
        lang = 'fr'
    return phonemizer(grapheme, lang = lang), 200
