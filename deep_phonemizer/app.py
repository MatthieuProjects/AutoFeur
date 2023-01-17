from dp.phonemizer import Phonemizer
from flask import Flask
from flask import request

phonemizer = Phonemizer.from_checkpoint('latin_ipa_forward.pt')
app = Flask(__name__, instance_relative_config=True)

@app.route('/')
def handle():
    searchword = request.args.get('grapheme', '')
    return phonemizer(searchword, lang = 'fr')
