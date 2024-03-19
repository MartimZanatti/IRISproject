import pypandoc
from bs4 import BeautifulSoup
import re


class Judgment:

    def __init__(self, doc_name, type, italic):
        if type == "docx": #doc_name is a docx file
            self.html = self.init_docx_format(doc_name)
            self.paragraphs = []
            self.add_paragraphs(italic)
        elif type == "html": #doc_name is a html file
            with open(doc_name, "r", encoding='utf-8') as f:
                self.html = f.read()
            self.paragraphs = []
            italic = False
            self.add_paragraphs(italic)
        elif type == "text": #doc_name is a txt file
            f = open(doc_name, "r", encoding="utf-8")
            lines = f.read()
            paragraphs_text = lines.split('\n')
            paragraph_id = 1
            self.paragraphs = []
            # here doc_name is the text
            for p in paragraphs_text:

                if not re.match(r'^[^a-zA-Z0-9]+$', p) and not p.isspace() and p: # se um paragrafo so contiver simbolos:
                    self.paragraphs.append(ParagraphText(text=p, id=paragraph_id))
                    paragraph_id += 1

    def init_docx_format(self, doc_name):
        html = pypandoc.convert_file(doc_name, "html", extra_args=["--wrap", "none"])
        return html

    def add_paragraphs(self, italic):

        paragraph_id = 1  # id do paragrafo
        self.html = re.sub(r'<div>', '<p>', self.html)
        self.html = re.sub(r'</div>', '</p>', self.html)
        self.html = re.sub(r'<b>', '<p>', self.html)
        self.html = re.sub(r'<br>', '</p><p>', self.html)
        self.html = self.html + '</p>'
        soup = BeautifulSoup(self.html, "html.parser")
        paragraph_division = soup.find_all("p")  # divide o doc html por paragrafos
        #print(paragraph_division)
        for paragraph in paragraph_division:
            self.paragraphs.append(Paragraph(text=paragraph, id=paragraph_id, italic=italic))
            paragraph_id += 1

    def get_italic_by_paragraph_id(self, id):
        for p in self.paragraphs:
            if p.id == id:
                return p.italic

    def get_zone_by_paragraph_id(self, id):
        for p in self.paragraphs:
            if p.id == id:
                return p.zone

    def change_paragraph_zone_by_id(self, id, zone):
        for p in self.paragraphs:
            if p.id == id:
                p.zone = zone

    def get_best_paragraphs(self, ids, output, scores):
        text = output["text"]
        best_paragraphs = []
        correspondent_zones = []

        for p in self.paragraphs:
            if p.id in ids:
                index = ids.index(p.id)
                if type(p) is Paragraph:
                    best_paragraphs.append((p.text.get_text(), p.id, scores[index]))
                else:
                    best_paragraphs.append((p.text, p.id, scores[index]))
                correspondent_zones.append(p.zone)
            else:
                if type(p) is Paragraph:
                    best_paragraphs.append((p.text.get_text(), p.id, 0))
                else:
                    best_paragraphs.append((p.text, p.id, 0))


        return best_paragraphs, correspondent_zones

    def get_list_text(self):
        all_text = []
        ids = []
        text_ids = []
        i_char = 0
        for p in self.paragraphs:
            if type(p) is Paragraph:
                num_char = len(list(p.text.get_text()))
            else:
                num_char = len(list(p.text))
            end_char = i_char + num_char
            if not p.symbols:
                if type(p) is Paragraph:
                    all_text.append(p.text.get_text())
                    text_ids.append((p.text.get_text(), p.id, i_char + 1, end_char))
                else:
                    all_text.append(p.text)
                    text_ids.append((p.text, p.id, i_char + 1, end_char))
                ids.append((p.id, i_char + 1, end_char))


            i_char = end_char
        return all_text, ids, text_ids



class Paragraph:
    def __init__(self, text, id, italic):
        self.text = text
        self.id = id
        self.italic = False
        self.zone = "undefined"
        if is_only_symbols(text):
            self.symbols = True
        else:
            self.symbols = False
        if italic:
            if is_italic(text):
                self.italic = True

    def __getattribute__(self, item):
        return super(Paragraph, self).__getattribute__(item)


class ParagraphText: #in the case of text file
    def __init__(self, text, id):
        self.text = text
        self.id = id
        self.zone = "undefined"
        self.symbols = False

        if is_only_symbols_paragraph_text(text):
            self.symbols = True

    def __getattribute__(self, item):
        return super(ParagraphText, self).__getattribute__(item)


def is_only_symbols(text):
    paragraph_text = text.get_text()
    if re.match(r'^[^a-zA-Z0-9]+$', paragraph_text): # se um paragrafo so contiver simbolos
        return True

def is_only_symbols_paragraph_text(text):
    #print(text)
    if re.match(r'^[^a-zA-Z0-9]+$', text): # se um paragrafo so contiver simbolos
        return True

def get_paragraph_by_id(id, doc):
    for p in doc.paragraphs:
        if p.id == id:
            return p.text.get_text()


def add_zones_to_paragraph_objects(output_zones, doc):
        denotations = output_zones["denotations"]

        for d in denotations:
            if d["type"] in ["relatório", "delimitação", "fundamentação de facto", "fundamentação de direito", "decisão", "foot-note", "cabeçalho"]:
                ids_section = list(range(d["start"], d["end"] + 1))
                for id in ids_section:
                    if doc.get_zone_by_paragraph_id(id) == "undefined":
                        doc.change_paragraph_zone_by_id(id, d["type"])
            else:
                zones = d["zones"]
                for z in zones:
                    if doc.get_zone_by_paragraph_id(z[0]) == "undefined":
                        doc.change_paragraph_zone_by_id(z[0], d["type"])

def is_italic(paragraph_text, how_italic=0.9):
    #paragraph_content = paragraph_text.contents
    italic_len = 0
    all_string_len = len(str(paragraph_text.text).strip())
    if all_string_len == 0:
        return False
    italics = paragraph_text.find_all(["em", "i"])
    for i in italics:
        italic_len += len(str(i.text).strip())
    if italic_len / all_string_len > how_italic:
        return True

    return False