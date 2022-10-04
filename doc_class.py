import pypandoc
import re
from bs4 import BeautifulSoup
import stanza


from pre_processing import delete_refs, is_only_symbols, is_italic, is_foot_note, clean_text

class doc_class:

    def __init__(self, doc_name, preprocessing):
        self.html = self.init_docx_format(doc_name)
        self.paragraphs = []
        self.add_paragraphs(preprocessing)


    # converte um docx em html
    def init_docx_format(self, doc_name):
        html = pypandoc.convert_file(doc_name, "html", extra_args=["--wrap", "none"])
        return html

    def add_paragraphs(self, preprocessing):
        paragraph_id = 1 # id do paragrafo
        soup = BeautifulSoup(self.html)
        paragraph_division = soup.find_all("p") #divide o doc html por paragrafos
        for paragraph in paragraph_division:
            self.paragraphs.append(Paragraph(text=paragraph, id=paragraph_id, preprocessing=preprocessing))
            paragraph_id += 1



class Paragraph:

    def __init__(self, text, id, preprocessing):
        delete_refs(text)
        self.text = text
        self.id = id
        self.sumarizable = True
        self.title = False
        self.foot_note = False
        if preprocessing:
            if is_only_symbols(text):
                self.sumarizable = False
            if is_italic(text):
                self.italic = True
                self.sumarizable = False
            else:
                self.italic = False
            if is_foot_note(text):
                self.sumarizable = False
                self.foot_note = True
    def __getattribute__(self, item):
        return super(Paragraph, self).__getattribute__(item)


def get_text_by_id(paragraphs, _id):
    for p in paragraphs:
        if p.id == int(_id):
            return p.text.get_text()


nlp = None
def create_paragraph_stanza(text):
    global nlp
    new_text = clean_text(text)
    if not nlp:
        nlp = stanza.Pipeline('pt', processors="tokenize,mwt,pos,lemma", use_gpu=True)

    return nlp(new_text)
