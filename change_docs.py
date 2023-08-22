from glob import glob
import re
import os
import comtypes.client
import docx
import matplotlib.pyplot as plt



def change_doc_format():
    wdFormatDOCX = 16

    pathh = "../IrisDataset/Sumarios_doc/"

    sumarios = os.listdir(pathh)


    word = comtypes.client.CreateObject('Word.Application')
    #word.visible = 0

    for i, doc in enumerate(sumarios):
        fulldocpath = os.getcwd() + "\\" + pathh + doc
        osdocpath = os.path.abspath(fulldocpath).replace('\\', '\\\\\\\\')
        #docc = word.Documents.Add(osdocpath)
        wb = word.Documents.Open(osdocpath)
        #print(doc[:-4])
        out_file = os.path.abspath(pathh + doc[:-4] + ".docx")
        wb.SaveAs2(out_file, FileFormat=wdFormatDOCX) # file format for docx
        wb.Close()


    word.Quit()


def getText(filename):
    doc = docx.Document(filename)
    fullText = []
    for para in doc.paragraphs:
        fullText.append(para.text)
    return '\n'.join(fullText)

def stats_count_acordaos():
    path = "../IrisDataset/Acordaos/"

    dir = os.listdir(path)

    min_len = 10000000
    max_len = 0
    max_doc = ''
    count_len = 0
    count_acord_max = 0
    count_acord_min = 0
    maior_metade = 0

    for f in dir:
        text = getText(path + f)
        space_text = text.split()
        length = len(space_text)
        if length < min_len:
            min_len = length
            min_doc = f
        if length > max_len:
            max_len = length
            max_doc = f
        count_len += length
        if length > 776:
            count_acord_max += 1
        else:
            if length > 3880:
                maior_metade += 1
            count_acord_min += 1


    print("acordão menor: ", min_len)
    print("acordão maior: ", max_len)
    print("max doc: ", max_doc)
    print("min doc: ", min_doc)
    print("media: ", count_len//len(dir))
    print("maior que a media: ", count_acord_max)
    print("menor que a media: ", count_acord_min)
    print(" maior que metade da media de baixo: ", maior_metade)



def stats_count_sumario():
    path = "../IrisDataset/Sumarios/"

    dir = os.listdir(path)

    min_len = 10000000
    max_len = 0
    max_doc = ''
    count_len = 0
    count_acord_max = 0
    count_acord_min = 0



    for f in dir:
        text = getText(path + f)
        space_text = text.split()
        length = len(space_text)
        if length < min_len:
            min_len = length
            s_min = f
        if length > max_len:
            max_len = length
            max_doc = f
        count_len += length
        if length > 220:
            count_acord_max += 1
        else:
            count_acord_min += 1




    print("acordão menor: ", min_len)
    print("acordão maior: ", max_len)
    print("max doc: ", max_doc)
    print("min sum: ", s_min)
    print("media: ", count_len//len(dir))
    print("maior que a media: ", count_acord_max)
    print("menor que a media: ", count_acord_min)
    #print(" maior que metade da media de baixo: ", maior_metade)




#stats_count_sumario()

#stats_count_acordaos()


def coiso():
    path_c = "../IrisDataset/Acordaos/"
    path_s = "../IrisDataset/Sumarios/"
    dir_acordaos = os.listdir(path_c)
    #dir_sum = os.listdir(path_s)
    #more_than_average = 0
    num_percent = 0
    num_p_sum = 0


    for f in dir_acordaos:
        clean_space_text = []
        clean_space_text_sum = []
        text = getText(path_c + f)
        space_text = text.split('\n')
        for t in space_text:
            if not re.match(r"[^a-zA-Z]$", t) and not re.match(r"^$", t):
                clean_space_text.append(t)

        length = len(clean_space_text)
        #print(length)
        if 100 <= length < 300:
            text_s = getText(path_s + f)
            space_text_s = text_s.split('\n')
            for t in space_text_s:
                if not re.match(r"[^a-zA-Z]$", t) and not re.match(r"^$", t):
                    clean_space_text_sum.append(t)

            length_s = len(clean_space_text_sum)

            percent = length_s/length * 100

            num_percent += percent
            num_p_sum += 1


    print(num_percent//num_p_sum)
    print(num_percent / num_p_sum)





#coiso()


def acordaos_box_plot():
    path = "../IrisDataset/Acordaos/"
    dir = os.listdir(path)
    lens_acordaos = []
    max_lines = 0


    for f in dir:
        clean_space_text = []
        text = getText(path + f)
        space_text = text.split('\n')

        for t in space_text:
            if not re.match(r"[^a-zA-Z]$", t) and not re.match(r"^$", t):
                clean_space_text.append(t)


        length = len(clean_space_text)
        if length > max_lines:
            max_lines = length
        lens_acordaos.append(length)


    print(max_lines)
    fig = plt.figure(figsize=(10, 7))
    ax = fig.add_axes([0.15, 0.1, 0.7, 0.8])

    ax.set_xticklabels(["judgments"])
    ax.set_title("num of paragraphs per judgment")
    ax.boxplot(lens_acordaos)
    plt.show()
    plt.savefig("acordaos.png")


#acordaos_box_plot()


def sumarios_box_plot():
    path = "../IrisDataset/Sumarios/"
    dir = os.listdir(path)
    lens_acordaos = []
    max_lines = 0


    for f in dir:
        clean_space_text = []
        text = getText(path + f)
        space_text = text.split('\n')

        for t in space_text:
            if not re.match(r"[^a-zA-Z]$", t) and not re.match(r"^$", t):
                clean_space_text.append(t)


        length = len(clean_space_text)
        lens_acordaos.append(length)


    fig = plt.figure(figsize=(10, 7))
    ax = fig.add_axes([0.15, 0.1, 0.7, 0.8])

    ax.set_xticklabels(["summaries"])
    ax.set_title("num of paragraphs per summary")
    ax.boxplot(lens_acordaos)
    plt.show()
    #plt.savefig("acordaos.png")


#sumarios_box_plot()



