import re
import nltk
import spacy

from fake_entity import fake_entity


EXCLUDE = ['Tribunal','Réu','Reu','Ré','Supremo Tribunal de Justiça',"STJ","Supremo Tribunal",
            'Requerida','Autora','Instância','Relação','Supremo','Recorrente','Recorrida'
            'Tribual da Relação']
EXCLUDE_lower = [x.lower() for x in EXCLUDE]
EXCLUDE_upper = [x.upper() for x in EXCLUDE]
PATTERN_DATA = r"\d{1,2}(-|\.|/)\d{1,2}(-|\.|/)\d{4}"
TITLE = ["relatório", "fundamentação", "decisão", "facto", "direito", "questão decidir", "enquadramento", "(in)admissibilidade recurso",
          "objecto recurso", "objeto recurso", "cumpre decidir", "apreciando", "questão resolver", "inconstitucionalidade", "nulidade", "direito fundamental",
          "reenvio prejudical", "incuprimento", "prescição", "litigância"    ]
TITLES = ["relatórios", "fundamentações", "decisões", "factos", "direitos", "questões decidir", "enquadramentos", "(in)admissibilidades recursos",
          "objectos recursos", "objetos recursos", "cumpre decidir", "apreciando", "questões resolver", "inconstitucionalidades", "nulidades", "direitos fundamentais",
          "reenvios prejudicais", "incuprimentos", "prescrições", "litigâncias"]

stop_words = nltk.corpus.stopwords.words('portuguese')
spacy_model = "./model-best" #modelo para as entidades


# elimina as chamadas as foot notes que se encontram no meio do texto
def delete_refs(text):
    if text.a != None:
        if text.find(class_ = "footnote-ref") != None:
            text.find(class_ = "footnote-ref").decompose()

def is_only_symbols(text):
    paragraph_text = text.get_text()
    if re.match(r'^[^a-zA-Z0-9]+$', paragraph_text): # se um paragrafo so contiver simbolos
        return True

def is_italic(paragraph_text, how_italic=0.9):
    italic_len = 0
    all_string_len = len(str(paragraph_text.text).strip())
    if all_string_len == 0:
        return False
    italics = paragraph_text.find_all(["em", "i"]) #retorna os paragrafos que contenham texto em italico
    for i in italics:
        italic_len += len(str(i.text).strip())
    if italic_len / all_string_len > how_italic: # se how_italic % for italico
        return True

    return False

def is_foot_note(text):
    if text.find_parent(class_ = "footnotes") != None: # se for foot note
        return True


def is_title(paragraphs): #funcao que verifica se um paragrafo é um titulo
    for paragraph in paragraphs:
        paragraph_text = paragraph.text.get_text()
        p_spaces = paragraph_text.split(' ')
        for i in range(len(p_spaces)):
            p_spaces[i] = p_spaces[i].lower()
            p_spaces[i] = "".join(c for c in p_spaces[i] if c.isalpha()) #tira os simbolos
        if len(p_spaces) <= 5:
            for title in TITLE:
                t_space = title.split(' ')
                if all(elem in p_spaces for elem in t_space):
                    if paragraph_text[-1] != '.' and paragraph_text[-1] != ';' and paragraph_text[-1] != ',' and paragraph.italic == False:
                        paragraph.title = True
                        paragraph.sumarizable = False
            for titles in TITLES:
                ts_spaces = titles.split(' ')
                if all(elem in p_spaces for elem in ts_spaces):
                    if paragraph_text[-1] != '.' and paragraph_text[-1] != ';' and paragraph_text[-1] != ',' and paragraph.italic == False:
                        paragraph.title = True
                        paragraph.sumarizable = False

def match_foot_note(paragraphs):
    for paragraph in paragraphs:
        paragraph_text = paragraph.text.get_text()
        if re.match("\s*\[[0-9]+\]\s*", paragraph_text): # se for uma foot note
            return True
    return False


def paragraph_only_ent(paragraph, ents): # funcao que verifica se um paragrafo so contem entidades
    ents_text = ''
    max_match_lower = 0
    word_lower = ''
    max_match_upper = 0
    word_upper = ''
    max_match = 0
    word = ''
    for ent in ents: # por cada entidade
        ents_text += ent.text
    paragraph = re.sub(r'[^\w\s]','',paragraph)
    ents_text = re.sub(r'[^\w\s]','',ents_text)
    ents_text = ents_text.replace(' ', '')
    for e in EXCLUDE:
        if e in paragraph:
            if max_match < len(e):
                word = e
                max_match = len(e)
    if max_match != 0 and word not in [ent.text for ent in ents]:
        paragraph = paragraph.replace(word,'')
    for e in EXCLUDE_lower:
        if e in paragraph:
            if max_match_lower < len(e):
                word_lower = e
                max_match_lower = len(e)
    if max_match_lower != 0 and word not in [ent.text for ent in ents]:
        paragraph = paragraph.replace(word_lower,'')
    for e in EXCLUDE_upper:
        if e in paragraph:
            if max_match_upper < len(e):
                word_upper = e
                max_match_upper = len(e)
    if max_match_upper != 0 and word not in [ent.text for ent in ents]:
        paragraph = paragraph.replace(word_upper,'')
    paragraph = paragraph.replace(' ', '')
    if paragraph == ents_text:
        return True
    return False

def find_final_data(paragraphs):
    entities = {}
    id_ent = 1
    change_paragraphs = []
    count = 0
    for i, paragraph in enumerate(reversed(paragraphs)): # percorre os paragrafos do ultimo ao primeiro
        change_paragraphs.append(paragraph)
        paragraph_text = paragraph.text.get_text()
        count += 1
        if match_foot_note(paragraphs[i - 5:i + 1]) == False: #verifica se ha foot notes entre i - 5 e i + 1
            snlp = spacy.load(spacy_model) # faz load do model spacy para as entidades
            doc = snlp(paragraph_text)
            list_ents = list(doc.ents)
            if re.match(PATTERN_DATA, paragraph_text): # caso especiais de datas que não sao apanhadas pelo modelo
                text = re.match(PATTERN_DATA, paragraph_text).group(0)
                list_ents.append(fake_entity("DAT", text))
            if list_ents != []:
                for ent in list_ents:
                    if not re.match("\s*[0-9]+ª+\s*", ent.text): #caso especial para entidades mal associadas
                        entities[str(id_ent)] = (ent.text, ent.label_, i)
                        id_ent += 1
                    if ent.label_ == "DAT":  # se a entidade for data
                        if entities[str(id_ent - 2)][1] == "LOC" and entities[str(id_ent - 2)][2] == i \
                                and paragraph_only_ent(paragraph_text, list_ents):  # se a entidade seguinte for uma localidade e este paragrafo so tiver entidades
                            change_paragraphs_sumarizable(change_paragraphs, False)
                            change_paragraphs = []
                            break
                        elif entities[str(id_ent - 2)][1] == "ORG" and entities[str(id_ent - 2)][2] == i \
                            and paragraph_only_ent(paragraph_text, list_ents):  # se a entidade seguinte for uma organização
                            change_paragraphs_sumarizable(change_paragraphs, False)
                            change_paragraphs = []
                            break
                        elif len(list_ents) == 1 and paragraph_only_ent(paragraph_text, list_ents): # se for so a data
                            change_paragraphs_sumarizable(change_paragraphs, False)
                            change_paragraphs = []
                            break

        if count == 50:
            break


def remove_stop_words(paragraph_text):
    p_spaces = paragraph_text.split(' ')
    text = ''
    for word in p_spaces:
        if word not in stop_words and word.isalnum() and len(word) >=3:
                text += word + ' '
    return text

def before_italic_and_small_paragraphs(paragraphs):
    for i,paragraph in enumerate(paragraphs):
        if paragraph.italic == True:
            t = paragraphs[i-1].text.get_text().strip()
            if t[-1] == ":":
                paragraphs[i-1].sumarizable = False
        else:
            text = remove_stop_words(paragraph.text.get_text().strip())
            if len(text.split(' ')) <= 3:
                paragraph.sumarizable = False

def change_paragraphs_sumarizable(paragraphs, value):
    for p in paragraphs:
        p.sumarizable = value


# fim do pre-processamento para saber se um paragrafo é ou nao sumarizavel

#limpa o texto antes de criar o objecto stanza
def clean_text(text):
    new_text = correcoes_manuais(text)
    return new_text


def roman_pattern_def():
    return re.compile(r"""^M{0,3}
                            (CM|CD|D?C{0,3})?
                            (XC|XL|L?X{0,3})?
                            (IX|IV|V?I{0,3})?
                            \s+\-\s""", re.VERBOSE)

def correcoes_manuais(text):
    # iremos corrigir quando temos pontos -> 1. {frase} 2. {frase} 3. {frase} e os pontos (1. , 2. , 3. , 4.) sao considerados frases e
    # tambem quando temos numeração romana

    new_text = ''
    roman_pattern = roman_pattern_def()
    if re.match("^\d+(\s+|\.|º|ª|-)\s*.*", text):
        # print("TEXT", text)
        patt = "^\d+(\s+|\.|º|ª|-)\s*"
        result = re.split(patt, text)
        # print("RESULT", result)
        new_text += result[-1] + ' '
    elif re.match(roman_pattern, text):
        result = re.split(roman_pattern, text)
        new_text += result[-1] + ' '
    else:
        new_text += text + ' '

    if re.match(r"[a-zA-Z0-9]\s«[A-Z]", text):
        result = re.split("\s«", text)
        new_character = result[1][0].lower()
        text_aux = str(new_character) + result[1][1:]
        if new_text != '':
            new_text_split = re.split("\s«", new_text)
            new_text = new_text_split[0] + ' ' + text_aux + ' '
        else:
            new_text += result[0] + ' ' + text_aux + ' '

    return new_text

def check_bad_sentences_division(text):
    if re.match(r"\s*[^a-zA-Z]+\s*$", text): #se nao contiver letras
        return True
    if re.match(r"\s*[a-zA-Z]{1}\s*[^a-zA-Z]\s*$", text): #se so contiver um letra
        return True