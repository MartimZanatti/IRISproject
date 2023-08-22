import os
from bs4 import BeautifulSoup
import pypandoc
from pre_processing import is_foot_note, is_only_symbols, find_final_data
import json
import re


relatorio_section = ["irelatório", "relatório", "1relatório", "súmuladoprocesso"]
delimatacao_section = ["iidelimitaçãodoobjectodorecurso", "iidaadmissibilidadedorecurso", "delimitaçãoobjectivadorecurso", "iidelimitaçãodoobjectodarevista", "iidoobjetodorecurso", "iioobjetodorecurso", "iiadmissibilidadeeobjetodorecurso", "iidelimitaçãodoobjetodaação", "iidaadmissibilidadeeobjectodorecurso"]
fundamentacao_section = ["iiifundamentação", "fundamentaçãodefacto", "iianáliseefundamentosdecisórios", "iiapreciaçãodosrecursosefundamentação", "iiapreciaçãoefundamentação", "iifundamentaçãodefacto", "iifundamentação", "iidoméritodareclamação ", "fundamentação", "fundamentos", "2fundamentação", "iiapreciaçãodorecursoefundamentos", "iiapreciaçãodorecursoefundamentação", "iifactosprovados", "iiapreciaçãoefundamentosdecisórios", "ivfundamentação", "iiapreciando", "iiosfactos", "iiiosfactos", "iiidaalteraçãodamatériadefactoprovada", "iiapreciaçãodorecurso"]
decisao_section = ["ivdecisão", "videcisão", "iiidecisão", "decisão", "3decisão", "iiidispositivo", "dispositivo", "vdecisão"]



class doc_class:

    def __init__(self, doc_name):
        self.html = self.init_docx_format(doc_name)
        self.paragraphs = []
        self.add_paragraphs()

    def add_paragraphs(self):
        paragraph_id = 1 # id do paragrafo
        soup = BeautifulSoup(self.html, features="lxml")
        paragraph_division = soup.find_all(["p", "h4", "h3", "h1", "h2"]) #divide o doc html por paragrafos
        for paragraph in paragraph_division:
            self.paragraphs.append(Paragraph(text=paragraph, id=paragraph_id))
            paragraph_id += 1


    def init_docx_format(self, doc_name):
        html = pypandoc.convert_file(doc_name, "html", extra_args=["--wrap", "none"])
        return html


class Paragraph:

    def __init__(self, text, id):
        self.text = text
        self.id = id
        self.foot_note = False
        self.final_date = False
        self.declaracao = False

        if is_foot_note(text):
            self.foot_note = True
    def __getattribute__(self, item):
        return super(Paragraph, self).__getattribute__(item)



def get_block_section(doc):
    cabecalho = []
    relatorio = []
    delimitacao = []
    titulo = []
    current_section = ''
    fundamentacao = []
    decisao = []
    fim = []
    declaracao = []
    sections = {}
    current_list = []


    for p in doc.paragraphs:
        paragraph_text = p.text.get_text()
        paragraph_text_aux = re.sub(r'[^\w]', '', paragraph_text).lower()
        if paragraph_text_aux not in relatorio_section and titulo == []:
            current_section = "cabeçalho"
            cabecalho.append(p)
            current_list.append(p)
        elif paragraph_text_aux in relatorio_section and current_section == "cabeçalho":
            print("relatorio: ", paragraph_text)
            sections[current_section] = current_list
            current_list = []
            titulo.append(p)
            current_section = "relatório"
            continue
        elif paragraph_text_aux in delimatacao_section:
            print("delimitação: ", paragraph_text)
            sections[current_section] = current_list
            current_list = []
            titulo.append(p)
            current_section = "delimitação"
            continue
        elif paragraph_text_aux in fundamentacao_section:
            print("fundamentacao: ", paragraph_text)
            sections[current_section] = current_list
            current_list = []
            titulo.append(p)
            current_section = "fundamentação"
            continue
        elif paragraph_text_aux in decisao_section:
            if current_section != "fundamentação":
                continue
            print("decisao: ", paragraph_text)
            sections[current_section] = current_list
            current_list = []
            titulo.append(p)
            current_section = "decisão"
            continue

        if not p.foot_note and not is_only_symbols(p.text):
            if current_section == "relatório":
                relatorio.append(p)
                current_list.append(p)
            elif current_section == "delimitação":
                delimitacao.append(p)
                current_list.append(p)
            elif current_section == "fundamentação":
                fundamentacao.append(p)
                current_list.append(p)
            elif current_section == "decisão":
                if p.final_date == False:
                    decisao.append(p)
                    current_list.append(p)
                else:
                    if p.declaracao == False:
                        print("fim")
                        print("texto fim: ", p.text.get_text())
                        fim.append(p)
                    else:
                        print("declaracao")
                        print("texto declaracao: ", p.text.get_text())
                        declaracao.append(p)


    sections[current_section] = current_list
    sections["colectivo"] = fim
    #if fim != []:
    #    sections["colectivo"] = fim
    if declaracao != []:
        sections["declaração"] = declaracao




    #print(cabecalho)
    #print(titulo)
    #print(relatorio[-1])
    #print(delimitacao[-1])
    #print(fundamentacao[-1])
    #print(decisao[-1])
    #print(fim[-1])

    #print(sections)

    return sections, titulo

def get_text_doc(doc):
    list_text = []
    for p in doc.paragraphs:
        text = p.text.get_text()
        list_text.append((text, p.id))

    return list_text


def create_json(sections, list_tex, titulo):
    json_file = {"wrapper": "plaintext", "text": list_tex, "denotations": []}
    id = 1

    for key,value in sections.items():
        print("key:", key)
        json_file["denotations"].append({"id": id, "start": value[0].id, "end": value[-1].id, "type": key})
        id += 1


    titulos_ids = get_ids_list(titulo)
    json_file["denotations"].append({"id": id, "titulos_ids": titulos_ids, "type": "título"})

    json_object = json.dumps(json_file)

    return json_object



def get_ids_list(l):
    ids_list = []

    for p in l:
        ids_list.append(p.id)

    return ids_list


path = '../IrisDataset/test_examples/'
write_path = "../IrisDataset/zones_dataset/"

files = os.listdir(path)
for file_name in files:
    print(file_name)
    doc = doc_class(path + file_name)
    find_final_data(doc.paragraphs)
    sections, titulo = get_block_section(doc)
    list_text = get_text_doc(doc)
    json_file = create_json(sections, list_text, titulo)

    with open(write_path + file_name[:-5] + ".json", "w", encoding="utf-8") as out_file:
        out_file.write(json_file)


