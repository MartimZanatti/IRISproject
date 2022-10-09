class ParRowExtracted extends HTMLElement{
    constructor(){
        super();
        let template = document.getElementById("par-row-extracted-template").content.cloneNode(true);
        let shadow = this.attachShadow({mode: 'closed'});
        shadow.appendChild(template);
    }
}

class ParRow extends HTMLElement{
    constructor(){
        super();
        let template = document.getElementById("par-row-template").content.cloneNode(true);
        let shadow = this.attachShadow({mode: 'closed'});
        shadow.appendChild(template);
    }

    static get observedAttributes(){
        return ['data-saved']
    }

    attributeChangedCallback(attrName, lastVal, newVal){
        if( lastVal === null) return; // just inserted
        console.assert(attrName=='data-saved')
        
        if( newVal === 'true' ){
            if( !this._parExtracted ){
                this._parExtracted = createDocumentParagraphExtracted(this);
            }
            this._parExtracted.dataset.saved = true;
        }
        else{
            this._parExtracted.dataset.saved = false;
        }
    }
}

customElements.define('par-row-extracted', ParRowExtracted)
customElements.define('par-row', ParRow);

function showResponse(arrayOfParagraphs){
    let parent = document.getElementById("out");
    parent.innerHTML = "";
    let extractedParent = document.getElementById("sentences");
    extractedParent.innerHTML = "";

    let sortedScores = arrayOfParagraphs.filter(o => o.score !== null).sort((a,b) => b.score - a.score);
    let top5minScore = sortedScores.length >= 5 ? sortedScores[4].score : sortedScores.slice(-1)[0].score;
    let top7minScore = sortedScores.length >= 7 ? sortedScores[6].score : sortedScores.slice(-1)[0].score;
    let top10minScore = sortedScores.length >= 10 ? sortedScores[9].score : sortedScores.slice(-1)[0].score;
    let top15minScore = sortedScores.length >= 15 ? sortedScores[14].score : sortedScores.slice(-1)[0].score;
    let top20minScore = sortedScores.length >= 20 ? sortedScores[19].score : sortedScores.slice(-1)[0].score;
    let preSelectPars = [];
    arrayOfParagraphs.forEach((par, index) => {
        let parRow = createDocumentParagraph(par.text, index+1, par.score >= top5minScore ? 4 : par.score >= top10minScore ? 3 : par.score >= top15minScore ? 2 : par.score >= par.score >= top20minScore ?  1 : 0)
        if( par.score >= top7minScore ){
            parRow.dataset.saved = true;
        }
    });
}

// Setup page events to handle a file.
addEventListener("load", function () {
    document.getElementById("file").addEventListener("change", function (e) {
        postFile(e.target.files[0]);
    });
    document.body.addEventListener("dragover", function (e) {
        e.preventDefault();
        e.stopPropagation();
    });
    document.body.addEventListener("drop", function (e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById("file").files = e.dataTransfer.files;
        document.getElementById("file").dispatchEvent(new Event("change"));
    });
    document.getElementById("fake-input").addEventListener("click", function (e) {
        document.getElementById("file").click();
    });
});

// Submit file to server.
function postFile(file) {
    if( postFile.processingPost ) return; // prevent multiple submits
    postFile.processingPost = true;
    
    showProgress("0%");
    let title = document.getElementById("title");
    title.innerText = file.name;

    let fk = document.getElementById("fake-input");
    if (fk) {
        fk.remove();
    }

    showProgress("10%")
    let formData = new FormData();
    formData.append("file", file);
    fetch("./", {
        method: "POST",
        body: formData
    }).then(response => {
        showProgress("75%")
        return response.json()
    }).then(json => {
        showProgress("85%")
        showResponse(json);
    }).catch(e => {
        console.log(e);
        alert("Error! " + e)
    }).finally(() => {
        postFile.processingPost = false;
        hideProgress();
    });
}

function showProgress(percentString){
    let progressParent = document.getElementById("progress-parent");
    let progressBar = document.getElementById("progress-bar");
    progressParent.removeAttribute("hidden");
    progressBar.style.width = percentString;
}

function hideProgress(){
    let progressParent = document.getElementById("progress-parent");
    let progressBar = document.getElementById("progress-bar");
    progressParent.setAttribute("hidden", "");
    progressBar.style.width = "0%";
}

function createDocumentParagraph(htmlContent,parNumber, bin){
    let parent = document.getElementById("out");
    let par = document.createElement("par-row");
    par.dataset.par = parNumber;
    par.dataset.bin = bin;
    par.dataset.saved = false;
    par.dataset.visible = true;
    par.id = `par-${parNumber}`;

    let content = document.createElement("div");
    content.slot = "content"
    content.innerHTML = htmlContent
    par.appendChild(content);

    let controls = document.getElementById("controls-template").content.cloneNode(true);
    controls.slot = "controls";
    par.appendChild(controls);


    parent.appendChild(par);
    return par;
}

function createDocumentParagraphExtracted(parRow){
    let parent = document.getElementById("sentences");
    let par = document.createElement("par-row-extracted");
    par.dataset.par = parRow.dataset.par;
    par.dataset.saved = true;
    par.dataset.bin = parRow.dataset.bin;
    par.dataset.parId = parRow.id;

    let number = document.createElement("span");
    number.slot = "number";
    number.textContent = parRow.dataset.par;
    par.appendChild(number);

    let content = document.createElement("div");
    content.slot = "content"
    content.innerHTML = parRow.querySelector("[slot=content]").innerHTML;
    par.appendChild(content);

    let controls = document.getElementById("extracted-controls-template").content.cloneNode(true);
    controls.slot = "controls";
    let link = controls.getElementById('link-par')
    link.href=`#${parRow.id}`;
    link.id = "";
    par.appendChild(controls);

    let child = null;
    for( let other of parent.querySelectorAll('par-row-extracted') ){
        if( parseInt(other.dataset.par) > parseInt(par.dataset.par) ){
            child = other;
            break;
        }
    }
    parent.insertBefore(par, child);
    return par;
}

function toggleParagraph(controlElem){
    let parRow = controlElem.closest("par-row");
    if(!parRow) return;

    /**
     * dataset vars are always string.
     * 'false' === 'false' => true => 'true'
     * 'true' === 'false' => false => 'false'
     */
    parRow.dataset.saved = parRow.dataset.saved === 'false';
}

function toggleExctractedParagraph(controlElem){
    let parRowId = controlElem.closest("par-row-extracted").dataset.parId
    let parRow = document.getElementById(parRowId);

    parRow.dataset.saved = parRow.dataset.saved === 'false';
}

function showTop(bin){
    let out = document.getElementById("out");
    let pars = out.getElementsByTagName("par-row");

    for(let i = 0; i < pars.length; i++){
        let parRow = pars[i];
        if( parseInt(parRow.dataset.bin) >= bin ){
            parRow.dataset.visible = true;
        }
        else{
            parRow.dataset.visible = false;
        }
    }
}

function copyToClipboard(controlElem) {
    let parRow = controlElem.closest("par-row");
    if( !parRow ){
        let parRowId = controlElem.closest("par-row-extracted").dataset.parId
        parRow = document.getElementById(parRowId);
    }
    navigator.clipboard.writeText(parRow.querySelector("[slot=content]").innerText);
    controlElem.style.color = "lightgreen";
    setTimeout(() => {
        controlElem.style.color = "";
    }, 1500);
}

function exportDocx(){
    let pars = [];
    for( let par of document.querySelectorAll('par-row-extracted') ){
        if( par.dataset.saved === 'true' ){
            pars.push(new docx.Paragraph(par.querySelector("[slot=content]").textContent))
        }
    }
    const doc = new docx.Document({
        sections: [{
            children: pars
        }]
    });
    docx.Packer.toBlob(doc).then((blob) => {
        saveAs(blob, "sumario.docx")
    })

}
let demo = [
    {text:"<p>Esta aplicação permite ver e extraír os parágrafos mais importantes de um documento.</p>", score: null},
    {text:"<p>Para começar a usar a aplicação insira o documento que quer sumarizar.</p>", score: null},
    {text:"<p>O sumarizador irá dar uma pontuação aos parágrafos, e os sete mais relevantes serão selecionados automáticamente.</p>", score: null},
    {text:"<p>O utilizador poderá então controlar de forma total os parágrafos selecionados. Estes aparecem na area direita da aplicação.</p>", score: 1},
    {text:"<p>No final os parágrafos selecionados podem ser extraídos para um documento DOCX.</p>", score: null},


];

showResponse(demo);


let r = [
    {
        "score": null,
        "text": "<p><strong>Processo n.º 805/16.0T8MTJ.L1.S1</strong></p>"
    },
    {
        "score": null,
        "text": "<p><strong>Acordam, em conferência, no Supremo Tribunal de Justiça,</strong></p>"
    },
    {
        "score": null,
        "text": "<p><strong>I – Relatório</strong></p>"
    },
    {
        "score": 1.0128310800508884,
        "text": "<p>O Autor <strong><span class=\"smallcaps\">António Florindo Nunes Galvão</span></strong> arguiu, a 27 de agosto de 2018, depois de proferido o acórdão de fls 325 a 350, a 8 de maio de 2018, que conheceu do recurso de apelação interposto, a nulidade processual respeitante ao pagamento tardio da taxa de justiça subsequente, sem acréscimo de multa, por parte dos Réus. Nulidade esta resultante da “<em>sua falta de notificação do pagamento da taxa de justiça pelos</em>” ora Recorridos.</p>"
    },
    {
        "score": 0.9766279147223611,
        "text": "<p>Notificados, os Réus <strong><span class=\"smallcaps\">Maria Jesuína Pereira Galvão Pêgas</span></strong>, <strong><span class=\"smallcaps\">e Outros</span></strong>, nada disseram sobre a referida arguição da nulidade pelo Autor.</p>"
    },
    {
        "score": 1.0431366857809214,
        "text": "<p>Notificado da decisão singular proferida a 11 de outubro de 2018 sobre a nulidade processual por si invocada, que julgou improcedente a pretensão por si deduzida, concluindo pela inverificação da nulidade processual invocada, o Autor <strong><span class=\"smallcaps\">António Florindo Nunes Galvão</span></strong>, ao abrigo do art. 652.º, n.º 3, do CPC, requereu que sobre a matéria em apreço recaísse acórdão, insistindo se julgasse verificada a referida nulidade.</p>"
    },
    {
        "score": 0.9860909321312413,
        "text": "<p>Para o efeito, o Autor sustenta que esse pagamento, realizado a 21 de março de 2017 e comprovado a 29 de março de 2017, deveria ter sido feito até 19 de fevereiro de 2017, porquanto a audiência prévia teve lugar a 8 de fevereiro de 2017, sendo logo designada, para 4 de abril de 2017, a realização da audiência de julgamento. Alega que a secretaria deveria ter notificado os faltosos, decorrido o prazo legalmente estabelecido, para pagar a taxa de justiça acrescida de multa. Tal, todavia, não sucedeu, pelo que o pagamento intempestivamente efetuado, sem acréscimo de multa, implicaria que não fosse atendida a prova por eles produzida. Deste modo, esta encontra-se inquinada de nulidade. Invoca que não foi notificado do referido requerimento de 29 de março de 2017 e, por isso, não teve oportunidade de sobre ele se pronunciar. Refere também que o acórdão do Tribunal da Relação de Lisboa ainda não transitou em julgado, e que apenas quando foi confrontado com a nota de custas de parte verificou a existência da mencionada nulidade processual. Entende, por isso, estar em tempo de arguir aquela nulidade. Conclui no sentido da nulidade do processado na parte respeitante à prova produzida pelos Réus.</p>"
    },
    {
        "score": 1.0031754148115413,
        "text": "<p>Os Réus <strong><span class=\"smallcaps\">Maria Jesuína Pereira Galvão Pêgas</span></strong>, <strong><span class=\"smallcaps\">e Outros</span></strong>, responderam, pedindo se considerasse transitado o acórdão proferido a 8 de maio de 2018, se indeferisse o requerimento apresentado pelo Autor e se condenasse o mesmo como litigante de má-fé.</p>"
    },
    {
        "score": null,
        "text": "<p>Foi então prolatado o acórdão do Tribunal da Relação de Lisboa de 18 de outubro de 2018, que <em>indeferiu</em> a arguição da nulidade:</p>"
    },
    {
        "score": null,
        "text": "<p><em>“Termos em que e face ao exposto, acordam os Juízes desta Relação em:</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>- manter a decisão singular de 11.10.2018, a fls. 384 a 386, que julgou improcedente a pretensão deduzida pelo A./apelante, concluindo pela não verificação da nulidade processual invocada;</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>- julgar improcedente o pedido, formulado pelos RR./apelados, de condenação do A./apelante como litigante de má-fé.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>Custas do incidente pelo A./apelante, fixando-se a taxa de justiça em 3 UCs.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>Notifique.”</em></p>"
    },
    {
        "score": null,
        "text": "<p>Inconformado, o Autor interpôs recurso de revista, apresentando as seguintes <strong><span class=\"smallcaps\">Conclusões</span></strong>:</p>"
    },
    {
        "score": null,
        "text": "<p>“<em>1ª Em 27.08.2018, na sequência da notificação do indeferimento das nulidades assacadas ao acórdão de fls.,. datado de 08.05.2018, o qual, por unanimidade, fez confirmação do julgado da 1ª instância, fechou-se o ciclo recursivo por efeito da verificação da dupla conforme, pelo que o ora Recorrente passou à analise das custas de parte, que deveriam ser reclamadas nos cinco dias posteriores ao trânsito em julgado da decisão. E,</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>2ª Ao proceder à conferência da nota justificativa e discriminativa das custas de parte, o aqui Recorrente nela verificou que, de modo expresso, os RR/Recorridos declararam o dia 21.03.2017 enquanto data de pagamento da 2ª fase da taxa de justiça (por opção sua). E, assim alertado, compulsou os autos e pôde verificar que o comprovativo do dito pagamento nos autos, que jamais lhe foi notificado por quem quer que fosse, somente teve lugar em 29.03.2017. Ou seja: o comprovativo entrou atrasado e sem qualquer acréscimo quanto é certo que o prazo para a sua realização expirara a 19.02.2017.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>3ª Assim, sem mais delongas, no mesmo dia 27.08.2018 arguiu perante a Relação a nulidade processual que afecta a prova produzida pelos RR dada a insuficiência da taxa de justiça paga, porque em singelo e tardiamente, alegando para o efeito tudo quanto ficou dito sob a anterior conclusão, impetrando a produção de decisão declarando a nulidade da prova produzida pelos RR e tudo com as legais consequências.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>4ª Conhecendo da nulidade, a Relação, em decisão singular de fls. 384 a 386, datada de 11.10.2018, fundamentou-a nos termos seguintes.” Na situação em análise, é evidente que após o aludido pagamento da taxa de justiça realizado pelos RR, a partir do qual o A surpreende agora a existência de uma nulidade processual, teve pelo menos lugar a realização de julgamento, ao longo de duas sessões em 4.4.2017 e 20.04.2017, nas quais o A se fez representar pelo mandatário por si constituído.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>Assim, o prazo de 10 dias para invocar qualquer nulidade respeitante ao referido pagamento iniciou--se em 4.4.2017, data em que o A inequivocamente interveio no processo, impondo-se que averiguasse então da existência de qualquer vício processual entretanto verificada. Invocando o A apenas em 27.8.2018, após a prolação da sentença e do acórdão que conheceu do recurso da mesma interposto, a nulidade de um ato reportado a Março de 2017 e anterior á realização da audiência de discussão e julgamento, é obvio que o faz de forma claramente intempestiva, muito depois de decorrido o prazo para o efeito, encontrando-se há muito extinto o direito de praticar tal ato (art. 139, nº3 do C.P.C). Por outras palavras, encontra-se forçosamente sanada qualquer eventual nulidade ocorrida.”</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>5ª E com tal fundamentação, assim decidiu “é manifestamente improcedente a pretensão deduzida pelo A/Apelante, concluindo-se pela não verificação da nulidade processual invocada.”</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>6ª Notificado da dita decisão, o então Apelante, sentindo-se prejudicado pela mesma, reclamou para a conferência de sorte a que recaísse acórdão sobre a matéria. E</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>7ª Acórdão que manteve inteiramente a decisão singular de fls. 384 a 386, quer no segmento decisório, quer na fundamentação respectiva, mas aditando-lhe, expressamente, um pormenor subtil através do seguinte excerto “Ou seja, mostra-se irrelevante que dela não tivesse tomado efetivo conhecimento.” (ver e comparar a parte final da decisão singular e da colegial ao parágrafo que começa por dizer “Assim, o prazo de 10 dias para invocar qualquer nulidade respeitante ao referido pagamento iniciou-se em 4.4.2017 (…)”, para logo detectar a cambiante introduzida.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>8ª E aqui é que bate o ponto. Isto é: tanto a decisão singular quanto a colegial, ambas pecam no que toca ao factor conhecimento da nulidade por banda do aqui Recorrente. A primeira, fá-lo por omissão pura e simples já que não denota dar qualquer relevância sobre se, quando e de que modo o A/Apelante teve conhecimento efectivo da nulidade emergente do tardio pagamento da 2ª fase da taxa de justiça, bastando-se, tão-só, com o facto de que após o pagamento da dita taxa de justiça o A interveio, em 04.04.2017, na sessão de julgamento. A colegial, por seu turno, fá-lo apoucando o factor conhecimento efectivo, que considera irrelevante. E, deste modo, incorre em errada interpretação do texto legal.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>9ª O raciocínio subjacente à decisão singular, que é inaceitável de todo, encerra um equívoco uma vez que, à data de 04.04.2017, o A., sem obrigação de saber, desconhecia em absoluto a conduta negligente dos RR, pelo que lhe era, como de facto foi, absolutamente impossível suscitar a nulidade aqui em causa.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>10ª Já a decisão colegial, ao desmerecer a falta de conhecimento efectivo (da nulidade), apelidando – – a de irrelevante, melhor sorte não tem. Desde logo, por uma questão de ordem lógica e facilmente assimilável e segundo a qual ninguém reage ao desconhecido. E teria sido excelente que o douto acórdão o tivesse explicitado.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>10ª De todo o modo, a verdade é que anteriormente a 27.08.2018 o A/Apelante não tinha, nem teve, conhecimento, efectivo ou presumido, da extemporânea comprovação nos autos do pagamento tardio da 2ª fase da taxa de justiça. E dela</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>11ª Só tomou conhecimento quando procedia à conferência da nota das custas de parte cujo pagamento lhe estava a ser exigido, o que vale por dizer que só tomou conhecimento da nulidade quando (como diz a lei) foi notificado para qualquer termo do processo – V artº 199º, nº1, in fine, do Cód de Processo Civil.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>12ª Por conseguinte, a nulidade foi, dadas as circunstâncias de facto, suscitada em devido tempo sendo irrelevante que o tenha sido após o julgamento, a produção da sentença e do acórdão que se ocupou do recurso da mesma interposto. E isto pela elementar razão, para além das já invocadas, de que o acórdão ainda não conheceu trânsito em julgado.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>13ª É infinitamente preferível repor a justiça, mediante a produção de decisão declarando a nulidade da prova produzida pelos RR, a manter uma decisão claramente injusta e a benefício dos RR, que manifestamente fizeram ultraje da lei.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>14ª Sucede que à incúria dos RR, acresce a não menor incúria da secretaria, a quem, por disposição legal, compete “assegurar o expediente, autuação e regular tramitação dos processos pendentes, nos termos estabelecidos na respectiva lei de organização judiciária, em conformidade com a lei do processo e na dependência funcional do magistrado competente.”</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>15ª Será que competia, ou compete, ao A/Apelante escrutinar os actos da secretaria, paralelamente aos da contraparte de que sequer alguma vez notificado foi, ainda que oficiosamente? Isto não gera consequência alguma?</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>16º A este propósito ocorre, por exemplo, invocar o incumprimento do disposto no nº 5 do artº 570º por efeito da inobservância de disposto no artº 157º, ambos do Cód de Processo Civil. E assim,</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>17ª Diante dos acumulados atropelos à lei do processo, não será que a nulidade apontada esteja na fronteira ocupando uma linha muto ténue das nulidades de conhecimento oficioso?</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>18ª O presente recurso, que incide unicamente sobre a aplicação do direito aos factos, advém do douto acórdão que, salvo o devido respeito, fez errada interpretação da lei processual (cfr artº 199º, n.º1, in fine, do C.P.C) e, assim, abriu espaço à revista. -V artº 674º, nº 1, b), do Cód de Processo Civil.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>19ª Com efeito, o dito aresto é passível de recurso uma vez que consubstancia decisão interlocutória recaindo única e exclusivamente sobre a relação processual estando preenchidos todos os requisitos estabelecidos pelo artº 671, nº 2, do Cód de Processo Civil.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>20ª Assim, a título de acórdão – fundamento o aqui Recorrente socorre-se do acórdão do S.T.J, de 29.04.2014, relatado pelo Conselheiro Garcia Calejo, no âmbito dos autos de processo com o nº 1937/07.1TBVCD.P1.S1, de que junta uma cópia, e</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>21ª Do mesmo passo, para evidenciar a contradição com o recorrido invoca o acórdão da Relação do Porto, de 05.02.2001, relatado pelo Desembargador Emídio Costa, in JTRP000297116/ITIJ/Net, produzido no domínio da mesma legislação e sobre a mesma questão fundamental de direito, e do qual não cabe recurso ordinário por motivo alheio à alçada do tribunal, inexistindo acórdão de uniformização de jurisprudência com aquele conforme (segue cópia do dito).</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>22ª Para o que aqui importa, do acórdão-fundamento destaca o Recorrente, em parte, o sumário e a fundamentação, como se segue:</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>Do sumário</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>II – Para que a parte possa e deva invocar a nulidade, será necessário que tenha conhecimento dela (cfr artº 205º. nº1, do C.P.C</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>Da fundamentação</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>“ (…) De harmonia com o disposto no artº 205º nº1 daquele Código deve ser arguida pela parte interessada, no prazo de 10 dias (art. 153º nº1), a contar do dia em que a parte interveio no processo ou foi notificada para qualquer termo dele, mas neste último caso só quando deve presumir-se que então tomou conhecimento da nulidade ou dela pudesse tomar conhecimento, agindo com a necessária diligência. Evidentemente que para que a parte possa e deva invocar a nulidade, será necessário que dela tenha conhecimento. Não faria qualquer sentido que a parte fosse obrigada a arguir nulidades que não conhecesse ou não tivesse obrigação de conhecer (neste sentido se tem desenvolvido a jurisprudência deste Supremo, como se vêm por exemplo, do Acórdão de 13-1-2009 (relator Conselheiro Silva Salazar) inserido em www.dgsi.pt/jstj.nsf</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>23ª Já para evidenciar a contradição com o recorrido respiga do Ac da Relação do Porto e acima referido</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>Do sumário</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>II – O prazo para arguição de nulidade processual, cometida num momento em que a parte não esteve presente, inicia-se quando a parte intervier em algum acto praticado no processo, exigindo-se para o efeito a presença física da parte ou do seu mandatário, ou quando for notificada para algum termo do processo, desde que, pela natureza do acto a que se destina a notificação, a parte deva exercer uma actividade que, num sujeito de normal diligência, a levará a tomar conhecimento da nulidade.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>24ª Ambos os acórdãos referenciados dão pleno acolhimento à pretensão do Recorrente, pelo que o acórdão recorrido fez violação do disposto nos artigos 199º, nº1, in fine, 4º, 157º e 570º, nº 5, todos do Cód de Processo Civil, e, anda, dos artigos 13º, e 20, nº4 da C.R.P, e artº 7º da Convenção Universal dos Direitos do Homem</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>Termos em que,</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>Revogando-o, e, em seu lugar, outro produzindo mediante declaração da nulidade da prova produzida pelos RR, e tudo com as legais consequências, Vossas Excelências farão límpida</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>JUSTIÇA!”</em></p>"
    },
    {
        "score": null,
        "text": "<p>Os Réus/Recorridos contra-alegaram, apresentando as seguintes <strong><span class=\"smallcaps\">Conclusões</span></strong>:</p>"
    },
    {
        "score": null,
        "text": "<p>“<em>1- É pelas conclusões com que o recorrente remata a sua alegação (aí indicando, de forma sintética, os fundamentos por que pede a alteração ou anulação da decisão recorrida: art.º. 639º, nº 1, do C.P.C.) que se determina o âmbito de intervenção do tribunal ad quem.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>2- O presente recurso de Revista é interposto tendo por fundamento:</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>A - Da alegada existência de contradição entre o Acórdão em recurso e demais Acórdãos proferidos pelo Tribunal da Relação de Lisboa ou de outros Tribunais da Relação, sobre a mesma matéria de direito em discussão, a saber o alcance e a aplicação do disposto no 1rtigo 205º, n.º 1 do CPC e do artigo 153º, n.º 1, do mesmo diploma legal e verificando-se a mesma situação de facto, tudo como alegado pelo Recorrente na pag 4 das suas alegações, a seguir á interjeição “assim é que,…”.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>B - Tratar-se de decisão interlocutória, e aplicável, por se mostrarem preenchidos os requisitos do artigo 671º, n.º 2, al. a) e b) do CPC (vid paga 4 das alegações do Recorrente.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>3- Não ocorre qualquer contradição entre julgados.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>4- O Recorrido traz á colação, a fundamentar o presente recurso de revista na contradição de julgados, os acórdãos do STJ de 29-04-2014 e de 13-01-2009, este ultimo em que foi relator o Venerável Juiz Conselheiro Silva Salazar, disponíveis in www.dgsi.pt,que não versam sobre a aplicação do disposto no artigo 145º do CPC, aqui em causa nos autos, mas antes da nulidade resultante da deficiente gravação da prova, que não pode ser verificada pelos mandatários pela sua intervenção nos autos, nem resulta da consulta dos autos, e que só será apreendida no momento da audição das gravações para a elaboração das alegações de recurso;</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>5- E, do sumário do acórdão de 13-01-2009 resulta que a nulidade da deficiência da gravação, tem que ser aduzida juntamente com as alegações e até ao termo do respetivo prazo de apresentação.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>6- Deve, pois, ser indeferido o presente recurso de revista.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>7- Não estamos perante recurso de qualquer decisão interlocutória.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>8- Primeiro, porque não houve qualquer decisão interlocutória nos autos sobre esta matéria, mas uma questão suscitada pelo Recorrente a 27 de agosto de 2018, 3 meses e 17 dias após a prolação do Acórdão pelo Douto Tribunal da Relação de Lisboa.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>9- Constituem decisões interlocutórias todas as que forem proferidos pelo Juiz dentro do processo, sem ser a decisão final, e sobre as quais a parte recorrente tenha interposto recurso.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>10- O que não se verifica nos presentes autos, pelo que também por esta razão há que indeferir liminarmente o presente recurso de revista.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>11- Por outro lado, encontra-se, definitivamente precludido o direito do Recorrente em arguir a presente alegada nulidade, desde 04 de abril de 2017.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>12- Em 21/03/2017 os RR. procederam ao pagamento da 2ª tranche da taxa de justiça, com junção do comprovativo aos autos a 29/03/2017.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>13- A 04 de abril de 2017 teve início o julgamento, tendo a Meritíssima Juiz ordenado o início da produção de prova com a audição dos R.R., que prestaram declarações (vid ata de audiência de julgamento 04-04-2017-Hora 09:30), assistindo ao Recorrido e ao seu mandatário a obrigação de, nessa data, ter arguido a nulidade.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>14- Resulta do regime legal do artigo 149° n.° 1 do CPC que o prazo de 10 dias aí concedido conta-se de uma de duas circunstâncias, sendo aqui aplicável a situação da primeira intervenção no processo do mandatário do ora recorrente, marcando a mera intervenção processual do mandatária ou da parte “(…) o início do prazo para a sua arguição, o que significa que a parte tem o ónus de, mediante a consulta dos autos, detetar o vício, sob pena de preclusão (…)”, Conforme António Abrantes Geraldes, Paulo Pimenta e Luis Filipe Pires de Sousa, in Código de Processo Civil Anotado, Almedina, 2018, Vol I, pag 239;</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>15- E, de acordo com o regime estatuído e resultante do artigo 199°, n.° 1 do CPC, estando presente a parte, por si, ou por mandatário, as nulidades devem ser arguidas enquanto o ato não terminar, ou seja, o mandatário do ora recorrente deveria ter aduzido tal eventual e alegada nulidade até ao termo desse dia de 4 de abril de 2017, o que não fez, como resulta da Ata de Discussão e Julgamento.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>16- Não ocorreu, pois, qualquer nulidade, nem anterior, nem posterior á data da primeira sessão de audiência de discussão e julgamento, o dia 4 de abril de 2017, à Decisão da 1.ª instância, ás alegações de recurso do Recorrente ou á prolação do Douto acórdão pelo Tribunal da Relação de Lisboa em maio de 2018, nem do Douto Acórdão decisão singular proferido em 06 de julho de 2018, nem do Douto Acórdão decisão singular proferido em 16 de outubro de 2018, nem do Douto Acórdão em Conferência, aqui em recurso, proferidos pelo Tribunal da Relação de Lisboa, e muito menos ocorreu violação de qualquer preceito legal.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>17- E, apenas em 27 de agosto de 2018 vem o Recorrente aduzir esta nulidade, que deveria ter sido suscitada até ao termo da primeira sessão de julgamento, em 04/04/2017 (1.ª parte do n.º 1 do artigo 199º do CPC), pois era o momento para se aferir sobre a efetivação ou não do pagamento da 2ª prestação da taxa de justiça, sendo que caberia ao Tribunal tomar as devidas providências para a sanação da situação, caso a Meritíssima juiz assim o determinasse (n.º 2 do artigo 199º do CPC), cabendo ainda ao Tribunal determinar a impossibilidade da realização das diligências de prova que tenham sido requeridas pela parte em falta, de acordo com o prescrito pelo artigo 145º do CPC.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>18- Quanto á expressão do Recorrido vertida nas suas alegações no fim da pag 3 que “deveria ter consultado o Oráculo de Delfos?” apenas há a dizer que, nos termos do artigo 149º n.º 1 do CPC, o prazo de 10 dias para a arguição das nulidades aí concedido conta-se da circunstância da primeira intervenção do processo da outra parte, marcando a mera intervenção processual do mandatário ou da parte “(…) o início do prazo para a sua arguição, o que significa que a parte tem o ónus de, mediante a consulta dos autos, detetar o vício, sob pena de preclusão (…)”. 19- Precludiu, pois, o direito do Recorrente a 4 de abril de 2017.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>12- O mandatário do recorrente foi notificado, via citius, a 14 de maio de 2018 de nota discriminativa da conta de custas de parte, na qual já constava a data do pagamento pelos R.R. da 2.ª tranche da taxa de justiça (vid requerimento dos Recorridos de 14 de maio de 2018).</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>13- Em 19 de maio de 2018 o ora recorrente apresentou requerimento inominado a aduzir as seguintes nulidades do Douto Acórdão:</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>d) Nulidade de imparcialidade da Meritíssima Juiz da 1.ª instância;</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>e) Erro de julgamento;</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>f) Deficiente gravação da prova,</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>14- Não arguiu o recorrente neste requerimento a nulidade que constitui o fundamento do presente recurso de Revista para o STJ, (vid requerimento de 19 de maio de 2018), sobre o qual recaiu Douto Acórdão do Tribunal da Relação de Lisboa de 06-07-2018, a dar por improcedentes tais nulidades, por extemporaneidade.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>15- Em 9 de julho de 2018 os ora recorridos notificam, pela segunda vez, o mandatário do Recorrente de mesma nota discriminativa de conta de custas de parte, de que o haviam já notificado a 14 de maio de 2018.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>16- Cai assim por terra o argumento do Recorrente de que “só em 27.08.2018 o aqui Recorrente, ajudado pelos Recorridos, pôde, ao conferir a nota justificativa e discriminativa das custas de parte tomar conhecimento e verificar (…)” (pag 3 das alegações) a data do pagamento da 2.ª fase da taxa de justiça, quando tal não corresponde á verdade.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>17- Entre o dia 04/04/2017, data da primeira intervenção no processo do mandatário do Recorrente após a junção aos autos da 2.ª taxa de justiça pelos recorridos, e o dia 27 de agosto de 2018, data da arguição, pela primeira vez, da presente nulidade inominada, passaram mais de 10 dias, decorreram, mais propriamente, 16 meses e 23 dias;</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>18- A arguição da presente nulidade é pois claramente intempestiva, muito depois de decorrido o prazo para o efeito, encontrando-se há muito extinto o direito de praticar tal ato (artigos 149º e 199º, n.º 1 do CPC), mais propriamente há 16 meses e 23 dias, contados do dia 04 de abril de 2017 até ao dia 27 de agosto de 2018, tendo precludindo assim, definitivamente o seu direito a 4 de abril de 2017.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>19- Só o desespero de causa do Recorrido é que motiva o requerimento de 27 de agosto de 2018, indeferido por Douto Acórdão Singular e depois pelo Douto Acórdão de conferência, que dá origem ao presente Recurso de Revista, na tentativa vã de evitar que o Acórdão proferido pelo Tribunal da Relação de Lisboa em maio de 2018 transite em julgado.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>20- Os requerimentos e o presente recurso de revista sucessivamente apresentados pelo Recorrente destinam-se, tão só, a evitar que o Acórdão do Tribunal da Relação de Lisboa, proferido em maio de 2018, quase há um ano, transite em julgado, o que configuram manifestos expedientes dilatórios e que devem ser sancionados pelos Tribunais.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>Assim, deverá o presente recurso de revista ser indeferido, com as legais consequências, nomeadamente as do trânsito em julgado do Douto Acórdão proferido pelo Tribunal da Relação de Lisboa em maio de 2018,</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>Só assim se fazendo a VOSSA COSTUMADA BOA JUSTIÇA!”</em></p>"
    },
    {
        "score": null,
        "text": "<p>Segundo o acórdão do Supremo Tribunal de Justiça de 4 de fevereiro de 2020:</p>"
    },
    {
        "score": null,
        "text": "<p><em>“Nos termos expostos, julga-se o recurso improcedente, confirmando-se o acórdão do Tribunal da Relação de Lisboa”.</em></p>"
    },
    {
        "score": null,
        "text": "<p>O Autor interpôs então recurso para uniformização de jurisprudência – em vista da determinação do momento a partir do qual se começa a contar o prazo para arguir as nulidades processuais, nos termos do art. 199.º, n.º 1, do CPC - apresentando as seguintes <strong><span class=\"smallcaps\">Conclusões</span></strong>:</p>"
    },
    {
        "score": null,
        "text": "<p><em>“1ª A lei não levanta qualquer obstáculo à aplicação das normas contidas no artº 671º, nº 1 e 2, a), e b), do Cód. de Processo Civil, à admissibilidade da Revista, ainda que a questão nela suscitada apenas o tenha sido perante a Relação e somente conhecida por esta. Pelo contrário.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>2ª O campo de aplicação do referido comando normativo é, no dizer da lei, “ os acórdãos da Relação que apreciem decisões interlocutórias que recaiam unicamente sobre a relação processual” contanto que o recurso seja sempre admissível e ocorra contradição com outro, já transitado em julgado, prolatado pelo S.T.J., no domínio da mesma legislação e versando a mesma questão fundamental de direito, excepto se houver sido produzido acórdão de uniformização de jurisprudência com ele conforme.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>3ª Por conseguinte, ao admitir a Revista fixando a sua apreciação à luz do artº 671º, nº4 do C.P.C, o douto acórdão incorreu, salvo o devido respeito, em incorrecta interpretação do texto legal.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>4ª Acresce que a supra referida decisão se mostra em contradição com aqueloutra igualmente do S.T.J, de 29.01.2018, 6ª secção, in</em> <em>Proc 1410.17.0T8BRG-AG1.S1, de que se junta uma cópia enquanto acórdão-fundamento sendo que a contradição reside exactamente na circunstância de neste ter sido fixada jurisprudência segundo a qual “Não estando em causa uma decisão que tenha posto termo ao processo, mas antes de uma decisão que recaiu sobre intercorrência processual, a mesma só é compatível de Revista nas hipóteses aludidas nas alíneas a) e b), do artigo 671º, nº 2 do C,P.Civil”, e no acórdão sob recurso a Revista ter sido admitida e apreciada com exclusão da aplicação do dito artº 671º, nº 2, a) e b), do Cód. de Processo Civil</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>5ª Relativamente ao mérito da Revista, o douto acórdão incorreu em equivoco ao considerar que o Autor/Recorrente teria detectado a nulidade logo após à realização do referido pagamento da taxa de justiça, o que não corresponde à verdade porquanto isso não só não foi alegado por nenhuma das partes, não resulta dos autos de forma alguma e, acima de tudo, porque conforme vem sendo reiteradamente afirmado e nunca foi impugnado, o Autor/Recorrente só tomou conhecimento da nulidade quando, notificado foi da nota das custas de parte, em 27.08.2018 procedia à sua conferência. E isto porque os Réus/Recorridos indicaram, na dita nota de custas de parte, o dia 21.03.2017. Comprovando-o nos autos a 29.03.2017.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>6ª Com efeito, não deixa de ser estranho que o douto acórdão, que considera ser irrelevante que o Autor/Recorrente não tivesse tido conhecimento da nulidade uma vez que “a lei não se preocupa com a data em que a parte obteve realmente conhecimento da violação da lei”, afinal tenha considerado, embora erroneamente, uma data – na circunstância a data da “realização do referido pagamento da taxa de justiça”.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>7ª Na verdade, só se assim se compreenderia que o prazo de arguição da nulidade ter-se-ia iniciado a 04.04.2017. Ou seja: o conhecimento da nulidade não será assim tão despiciendo</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>8ª E à afirmação de que “ (…) estando antes na base da regra legal (…) a ideia de que, ao ser notificada ou ao intervir, a parte toma contacto com a nulidade e fica informada da existência dela” contrapõe-se a de que não ocorreu a notificação da comprovação nos autos por banda dos Réus/Recorrido a despeito de a isso estarem legalmente obrigados, nem a secção questionou a falta de notificação devida à contraparte assim como assumiu como integro o pagamento da taxa de justiça comprovado. E, ao intervir na audiência de o julgamento, o Autor/Recorrente não só não toma contacto directo com os autos, assim como não questiona sobre se o pagamento da taxa de justiça foi comprovado tempestivamente pois parte do princípio subjacente à base da regra legal de que a lei foi inteiramente observada por todos.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>9ª E àqueloutra afirmação segundo a qual “ a lei parte do principio de que uma intervenção cuidadosa implicará sempre o exame do processo e a verificação da (in) existência de uma qualquer nulidade, contrapõe-se estoutra de que a lei não impõe ao Autor/Recorrente o papel de espião ante actos dolosa e deliberadamente escamoteados, assim como o exame do processo, para o que aqui interessa, implicará sempre a existência de algum vestígio.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>10ª A menção contida na nota justificativa e discriminativa das custas de parte ao dia 21.03.2107, que funcionou de alerta ao Autor/Recorrente e por isso compulsou os autos e neles pôde verificar a comprovação tardia desacompanhada de multa, assume, no caso sub judice, a notificação a que a lei se reporta na parte final do artº 199º, nº1, do Cód de Processo Civil, ao dizer “ (…) ou foi notificada para qualquer termo dele, mas neste último caso só quando deva presumir-se que então tomou conhecimento da nulidade ou quando dela pudesse conhecer, agindo com m a devida diligência.”</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>11ª No caso em apreço, a realidade factual, se devidamente subsumida ao pertinente comando normativo, não poderá deixar de conduzir à produção de decisão que desatenda a prova produzida pelos Réus/Recorridos em ultraje à lei quanto é certo que o Autor/Recorrente não pode ser prejudicado pelos erros e omissões dos actos praticados pela secretaria judicial – Vide artigos 145º, nº 2, 157º, nº 6, 221º, nº1, e 199º,nº 1, 2ª parte, todos do Cód de Processo Civil.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>12ª E pede-se que seja desatendida a prova produzida pelos Réus/Recorridos porquanto lhes estava legalmente vedado fazer produção de prova.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>13ª Mas regressando à motivação por que se pede que seja produzida decisão de uniformização de jurisprudência, tal decorre da circunstância do acórdão ora sob recurso evidenciar contradição ante aqueloutro, de 29.04.2014, 1ª Secção, que aqui serve de acórdão-fundamento e por isso dele se junta uma cópia sendo que,</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>14ª A contradição reside exactamente na circunstância de que, enquanto no acórdão recorrido, se diz ser irrelevante que o Autor/Recorrente não tivesse tido conhecimento da nulidade cometida, ao invés, no acórdão – fundamento, diz-se que “ Para que a parte possa e deva invocar a nulidade, será necessário que tenha conhecimento dela (cf artº 205º, nº1, C.P.C).</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>15ª O acórdão recorrido, fez, pois, incorrecta interpretação dos artigos 671º, nº 2, a), e b), e 199º, nº1, ambos do Cód de Processo Civil.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>Termos em que,</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>Recebido o presente recurso, e com o sempre mui douto suprimento de Vexas, julgado o mesmo, a final, seja produzida decisão de uniformização de jurisprudência no sentido da prevalência do acordão-fundamento com o consequente revogação do acórdão recorrido e produzida declaração de desatendimento da prova produzida pelos Réus/ Recorridos, assim se fazendo sã e límpida</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>JUSTIÇA!”</em></p>"
    },
    {
        "score": null,
        "text": "<p>Por seu turno, os Réus/Recorridos, nas suas contra-alegações, apresentaram as seguintes <strong><span class=\"smallcaps\">Conclusões:</span></strong></p>"
    },
    {
        "score": null,
        "text": "<p><em>“1- O Recorrente parece, demonstrar, mais uma vez, ao interpor recurso, sobre recurso, que pretende evitar e protelar o trânsito em julgado do Acórdão proferido em 10-05-2018, há 2 anos!, pelo Tribunal da Relação de Lisboa de fls 325 e ss dos autos.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>2- E, como se verá, não se verifica qualquer discrepância de decisões preferidas pelo STJ sobre a mesma matéria.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>3- O presente recurso é interposto para efeitos de Uniformização de Jurisprudência, tendo por fundamento a alegada existência de contradição de julgados entre o Acórdão em recurso, datado de 4-02-2020, proferido pela 1.ª seção do STJ e o Acórdão proferido pelo Supremo Tribunal de Justiça de 29-01-2018, 6.ª seção, no Proc.º 1410/17.0T8BRG-AG1.S1 e Acórdão proferido pelo Supremo Tribunal de justiça de 29-04-2014, 1.ª secção, no Proc.º 1937/07.1TBVCD.P1.S1., os acórdãos fundamento.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>4- Alega o Recorrente tratarem-se ambos os arestos acórdão fundamento produzidos pelo Venerando STJ sobre a mesma matéria de direito em discussão, com o mesmo o alcance e a aplicação do disposto no artigo 199º, n.º 1 e 671º, n.º 2, al) a) e b) do CPC.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>5- O Acórdão proferido pelo Supremo Tribunal de Justiça de 29-01-2018, 6.ª seção, no Proc.º 1410/17.0T8BRG-AG1.S1 respeita a uma situação completamente diversa, tratando exclusivamente sobre a admissibilidade de revista num caso de decisão interlocutória.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>6- Ora, no presente caso o recurso de revista interposto pelo Recorrente foi admitido, conforme resulta até de fls. 9 e 10 do Douto Acórdão recorrido, pretendendo apenas o Recorrente introduzir agora novas questões para poder continuar na senda dos recursos.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>7- Não se verifica entre este acórdão “fundamento e o Acórdão recorrido qualquer contradição sobre a matéria em discussão, ou dito de outra forma, o Acórdão proferido pelo Supremo Tribunal de Justiça de 29-01-2018, 6.ª seção, no Proc.º 1410/17.0T8BRG-AG1.S1 não consubstancia fundamento para a procedência do recurso interposto para a Uniformização de jurisprudência, por contradição de julgados.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>8- A afirmação pomposa constante da conclusão 13.ª das alegações de recurso do recorrente é pois vazia de conteúdo.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>9- O Acórdão do STJ de 29-04-2014, 1.ª secção, no Proc.º 1937/07.1TBVCD.P1.S1. é o segundo acórdão fundamento apresentado pelo Recorrente.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>10-Ora, aqui chegados damos por reproduzido o constante na parte fundamentadora do Douto Acórdão recorrido sobre a aplicação de tal acórdão ao caso concreto: “o entendimento seguido pelo” STJ neste acórdão citado pelo Recorrente “não aproveita ao caso concreto, porquanto a invocação da nulidade foi enquadrada na ultima parte - e não na primeira parte- da segunda parte do n.º 1 do artigo 205º o CPC pré-vigente- “a contar do dia em que a parte …foi notificada para qualquer termo dele, mas neste último caso só quando deve presumir-se que então tomou conhecimento da nulidade ou dela pudesse tomar conhecimento, agindo com a necessária diligência.”</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>11-Este segundo Acórdão fundamento indicado pelo Recorrente e o Acórdão recorrido tratam de matéria diversa da que aqui nos ocupa, e de aplicação do direito de forma diferente, já que o acórdão fundamento é referente á situação de deficiente gravação da prova, sendo o momento da arguição da nulidade enquadrado na 2.ª parte do antigo artigo 205º do CPC de 1996, atual 199º, n.º 1, 2.ª parte,</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>12-E, no caso em apreço a nulidade, a existir, devia ter sido aduzida, pelo mandatário do Recorrente, até ao termo da diligência de julgamento, onde o mandatário do recorrente se encontrava presente, conforme resulta e manda a primeira parte do n.º 1 do artigo 199º do Código Processo Civil, ou seja, até ao termo do julgamento que teve lugar a 04 de abril de 2017.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>13-E, a 4 de abril de 2017 não foi arguida pelo mandatário do Recorrente qualquer nulidade, nem suscitada qualquer questão pelo mandatário do ora recorrente quanto ao pagamento/falta da taxa de justiça.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>14-Assim, na situação em apreço no Douto acórdão recorrido, é de aplicar a 1.ª parte do n.º 1 do disposto no artigo 205º do CPC de 1966, atualmente 1.ª parte do n.º 1 do disposto no artigo 199º do CPC.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>15-De acordo com o regime estatuído e resultante do artigo 199º, n.º 1, 1.ª parte do CPC, estando presente a parte, por si, ou por mandatário, as nulidades devem ser arguidas enquanto o ato não terminar, ou seja, o mandatário do ora recorrente deveria ter aduzido tal alegada nulidade até ao termo desse dia 4 de abril de 2017, o que não fez.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>16-Precludiu, pois, o direito do Recorrente a 4 de abril de 2017.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>17-Para a existência de contradição de acórdãos, seria necessário que ambos os acórdãos apresentados pelo Recorrente como fundamento incidissem sobre as mesmas questões no domínio da mesma legislação e sobre a mesma questão fundamental de direito,</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>18-O que não se verifica.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>19-Assim, não se verifica qualquer contradição de julgados, devendo ser indeferido o presente recurso de uniformização de jurisprudência.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>20-E, verifica-se ainda a dupla conforme entre a decisão do Acórdão do Tribunal da Relação de Lisboa de 29-11-2019 e do Supremo Tribunal de Justiça, ora recorrido.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>Assim, deverá o presente recurso para uniformização de jurisprudência ser indeferido, com as legais consequências, nomeadamente as do trânsito em julgado do Douto Acórdão proferido pelo TRL em 10-05-2018!</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>Só assim se fazendo a VOSSA COSTUMADA BOA JUSTIÇA!”</em></p>"
    },
    {
        "score": null,
        "text": "<p>Não admitindo o recurso, por despacho de 30 de setembro de 2020, a Senhora Relatora decidiu o seguinte:</p>"
    },
    {
        "score": null,
        "text": "<p><em>“Pelo exposto, decide-se não admitir:</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>o recurso para uniformização de jurisprudência interposto pelo Autor <strong><span class=\"smallcaps\">António Florindo Nunes Galvão,</span></strong> que tem por objeto a interpretação/aplicação do art. 671.º, n.º 2, als. a) e b), do CPC;</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>o recurso para uniformização de jurisprudência interposto pelo Autor <strong><span class=\"smallcaps\">António Florindo Nunes Galvão,</span></strong> que tem por objeto a interpretação/aplicação do regime plasmado no art. 199.º, n.º 1, 2.ª parte, do CPC.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>Custas pelos Autor/Recorrente”</em>.</p>"
    },
    {
        "score": 0.9899599937380504,
        "text": "<p>À luz do art. 692.º, n.º 2, do CPC, o Autor/Recorrente <strong><span class=\"smallcaps\">António Florindo Nunes Galvão</span></strong> veio reclamar para a conferência, pugnando pela admissão do recurso.</p>"
    },
    {
        "score": null,
        "text": "<p><strong>II – Questões a decidir</strong></p>"
    },
    {
        "score": 1.012862480147255,
        "text": "<p>Estão em causa as questões de se saber se se verificam ou não requisitos legalmente estabelecidos para a admissibilidade do recurso extraordinário para uniformização de jurisprudência no que respeita à interpretação/aplicação do art. 671.º, n.º 2, als. a) e b), do CPC, de um lado e, de outro, à interpretação/aplicação do regime plasmado no art. 199.º, n.º 1, 2.ª parte, do CPC.</p>"
    },
    {
        "score": null,
        "text": "<p><strong>III – Fundamentação</strong></p>"
    },
    {
        "score": null,
        "text": "<p><strong>De facto</strong></p>"
    },
    {
        "score": 0.7813220724987201,
        "text": "<p>Relevam os factos mencionados <em>supra</em>.</p>"
    },
    {
        "score": null,
        "text": "<p><strong>De Direito</strong></p>"
    },
    {
        "score": 1.0414688541499253,
        "text": "<p>Ao abrigo dos arts. 688.º e ss. do CPC, o Autor interpôs recurso para uniformização de jurisprudência, tendo por objeto duas questões de direito distintas.</p>"
    },
    {
        "score": 0.9965679905356427,
        "text": "<p>Importa, por isso, analisar separadamente cada um dos segmentos do requerimento de recurso para uniformização de jurisprudência.</p>"
    },
    {
        "score": 1.0090628734913802,
        "text": "<p><strong>Admissibilidade de recurso de revista de acórdão do Tribunal da Relação que, não apreciando decisão interlocutória do Tribunal de 1.ª Instância que incida apenas sobre a relação processual, recaia unicamente sobre a relação processual</strong></p>"
    },
    {
        "score": 1.0578125102377856,
        "text": "<p>A primeira questão objeto do pedido de uniformização de jurisprudência respeita aos fundamentos legais da admissão de recurso de revista de acórdão do Tribunal da Relação que, não apreciando decisão interlocutória do Tribunal de 1.ª Instância que incida apenas sobre a relação processual, recaia unicamente sobre a relação processual, no sentido ou conteúdo de pensamento que o Supremo Tribunal de Justiça, no acórdão de 4 de fevereiro de 2020, retirou do texto do art. 671.º, n.º 2, als a) e b), do CPC, por estar em contradição com o acórdão do mesmo Tribunal de 29 de janeiro de 2018 (proc. n.º 1410.17.0T8BRG-AG1.S), do qual o Autor/Recorrente juntou certidão.</p>"
    },
    {
        "score": 1.0545788840352377,
        "text": "<p>Suscita-se a questão prévia de se saber se a subsunção, feita pelo Supremo Tribunal de Justiça, no acórdão de 4 de fevereiro de 2020, do recurso de revista interposto pelo Autor ao abrigo do art. 671.º, n.º 4 – e não do n.º 2, als. a) e b), do mesmo preceito -, do CPC, é suscetível de constituir objeto de um recurso para uniformização de jurisprudência.</p>"
    },
    {
        "score": 1.009852948551874,
        "text": "<p>Com efeito, a consideração do recurso de revista interposto pelo Autor à luz do art. 671.º, n.º 4, do CPC - por se tratar de recurso de um acórdão do Tribunal da Relação que não apreciou uma decisão interlocutória do Tribunal de 1.ª Instância, mas antes de recurso de um acórdão do Tribunal da Relação que apreciou uma questão processual suscitada pela primeira vez -, não integra o segmento decisório do acórdão recorrido. Isto inviabiliza a possibilidade de dela interpor recurso para uniformização de jurisprudência.</p>"
    },
    {
        "score": 1.0472216837845312,
        "text": "<p>De resto, havendo o Supremo Tribunal de Justiça admitido o recurso de revista interposto ao abrigo do art. 671.º, n.º 4, do CPC, o Autor não foi minimamente afetado na sua pretensão de recorrer para o terceiro grau de jurisdição.</p>"
    },
    {
        "score": 1.061746718407407,
        "text": "<p>Em todo o caso, mesmo que se considerasse que tal não impede o conhecimento do requerimento em causa, e dando como conhecidos os pressupostos de admissibilidade do recurso para uniformização de jurisprudência, sempre importaria verificar se existe – ou não - a invocada contradição jurisprudencial no que respeita à subsunção ao n.º 4 do art. 671.º do CPC de recurso de revista de acórdão do Tribunal da Relação que recaia unicamente sobre a relação processual, mas que não aprecia uma decisão interlocutória do Tribunal de 1.ª Instância que incida apenas sobre a relação processual.</p>"
    },
    {
        "score": null,
        "text": "<p><strong>A contradição jurisprudencial</strong></p>"
    },
    {
        "score": null,
        "text": "<p>Nos termos do art. 688.º do CPC:</p>"
    },
    {
        "score": null,
        "text": "<p><em>“1 - As partes podem interpor recurso para o pleno das secções cíveis quando o Supremo Tribunal de Justiça proferir acórdão que esteja em contradição com outro anteriormente proferido pelo mesmo tribunal, no domínio da mesma legislação e sobre a mesma questão fundamental de direito.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>2 – Como fundamento do recurso só pode invocar-se acórdão anterior com trânsito em julgado, presumindo-se o trânsito.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>3 – O recurso não é admitido se a orientação perfilhada no acórdão recorrido estiver de acordo com jurisprudência uniformizada do Supremo Tribunal de Justiça.”</em></p>"
    },
    {
        "score": 1.0226306489750827,
        "text": "<p>No que respeita à contradição de julgados que fundamenta a admissibilidade do recurso de uniformização, a jurisprudência tem entendido ser necessária a verificação cumulativa de três requisitos de caráter substancial:</p>"
    },
    {
        "score": 0.9093664198986603,
        "text": "<p>a identidade da questão fundamental de direito;</p>"
    },
    {
        "score": 0.8449645955491561,
        "text": "<p>a identidade do regime normativo aplicável; e</p>"
    },
    {
        "score": 0.9158584860183595,
        "text": "<p>a essencialidade da divergência para a resolução de cada uma das causas.</p>"
    },
    {
        "score": null,
        "text": "<p>Ou, conforme resulta de fórmula mais desenvolvida:</p>"
    },
    {
        "score": null,
        "text": "<p>“<em>I - Para que exista um conflito jurisprudencial, susceptível de ser dirimido através do recurso extraordinário previsto no art. 688º do CPC, é indispensável que as soluções jurídicas, acolhidas no acórdão recorrido e no acórdão fundamento, assentem numa mesma base normativa, correspondendo a soluções divergentes de uma mesma questão fundamental de direito.</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>II - O preenchimento deste requisito supõe que as soluções alegadamente em conflito:</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>- correspondem a <strong>interpretações divergentes de um mesmo regime normativo</strong>, situando-se ou movendo-se no âmbito do mesmo instituto ou figura jurídica fundamental: implica isto, não apenas que não hajam ocorrido, no espaço temporal situado entre os dois arestos, modificações legislativas relevantes, mas também que as soluções encontradas num e noutro acórdão se situem no âmbito da interpretação e aplicação de um mesmo instituto ou figura jurídica - não integrando contradição ou oposição de acórdãos  o ter-se alcançado soluções práticas diferentes para os litígios através da respectiva <strong>subsunção ou enquadramento em regimes normativos materialmente diferenciados</strong>;</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>- têm na sua base <strong>situações materiais litigiosas</strong> que, de um ponto de vista jurídico-normativo – tendo em consideração a natureza e teleologia dos específicos interesses das partes em conflito – sejam análogas ou equiparáveis, pressupondo o conflito jurisprudencial uma <strong>verdadeira identidade substancial do núcleo essencial da matéria litigiosa</strong> subjacente a cada uma das decisões em confronto;</em></p>"
    },
    {
        "score": null,
        "text": "<p><em>- a questão fundamental de direito em que assenta a alegada divergência assuma um carácter <strong>essencial ou fundamental para a solução do caso,</strong> ou seja, que integre a verdadeira <strong>ratio decidendi</strong> dos acórdãos em confronto – não relevando os casos em que se traduza em mero obiter dictum ou num simples argumento lateral ou coadjuvante de uma solução já alcançada por outra via jurídica.</em>”</p>"
    },
    {
        "score": 0.9667432706010142,
        "text": "<p>Importa, pois, verificar se estas condições se encontram reunidas no que respeita às questões alegadamente em oposição identificadas pelos Autor/Recorrente no presente processo.</p>"
    },
    {
        "score": 1.0283403438950862,
        "text": "<p>Segundo o entendimento do acórdão recorrido – de 4 de fevereiro de 2020 -, embora o Autor/Recorrente invocasse as normas dos arts. 629.º, n.º 1, al. d), e 671.º, n.º 2, als, a) e b), do CPC, a circunstância de a referida nulidade processual ter sido unicamente invocada perante o Tribunal da Relação de Lisboa, e decidida por este Tribunal, afasta a consideração deste último preceito. Na verdade, o acórdão do Tribunal da Relação de Lisboa não incidiu sobre uma decisão interlocutória proferida pelo Tribunal de 1.ª Instância.</p>"
    },
    {
        "score": 1.0422253316473318,
        "text": "<p>Assim, não tendo sido impugnado o acórdão que decidiu sobre o mérito da causa - fls. 325 e ss. -, a admissibilidade do recurso de revista <em>sub judice</em> deve ser apreciada à luz do art. 671.º, n.º 4, do CPC.</p>"
    },
    {
        "score": 1.041283333192418,
        "text": "<p>Por seu turno, no acórdão-fundamento - de 29 de janeiro de 2018, proferido pela 6.ª Secção do Supremo Tribunal de Justiça -, em parte alguma da fundamentação se refere a hipótese de o acórdão do Tribunal da Relação recair apenas sobre a relação processual, mas não incidir sobre decisão interlocutória proferida pelo Tribunal de 1.ª Instância que incida unicamente sobre a relação processual.</p>"
    },
    {
        "score": 1.0505926457308037,
        "text": "<p>Com efeito, ambos os arestos – acórdão recorrido e acórdão-fundamento - afirmam que o recurso de revista interposto à luz do art. 671.º, n.º 2, do CPC, tem por objeto acórdãos do Tribunal da Relação que apreciem decisões interlocutórias proferidas pelo Tribunal de 1.ª Instância que recaiam unicamente sobre a relação processual, desde que verificados os requisitos previstos nas als. a) ou b) do mesmo preceito.</p>"
    },
    {
        "score": 0.9839142307631416,
        "text": "<p>De resto, não existe sequer a necessária identidade fáctica que permita concluir terem ambos os arestos tratado da mesma questão jurídica.</p>"
    },
    {
        "score": null,
        "text": "<p>Efetivamente:</p>"
    },
    {
        "score": 1.0397782398208644,
        "text": "<p>De um lado, no acórdão recorrido, trata-se de acórdão do Tribunal da Relação que indeferiu a nulidade – arguida apenas após o acórdão do Tribunal da Relação de Lisboa, de 8 de maio de 2018, que conheceu do recurso de apelação - derivada da falta de notificação do Autor/Recorrente do pagamento tardio da taxa de justiça subsequente, sem acréscimo de multa, pelos Réus/Recorridos;</p>"
    },
    {
        "score": 1.0558842016990972,
        "text": "<p>de outro lado, no acórdão-fundamento, está em causa a decisão do Tribunal da Relação que confirmou o despacho interlocutório que julgou tempestiva a apresentação da contestação pela Ré e, por isso, também, uma situação de dupla conformidade decisória.</p>"
    },
    {
        "score": 0.9559917608753435,
        "text": "<p>Não se verifica, pois, qualquer contradição sobre a mesma questão fundamental de direito.</p>"
    },
    {
        "score": 1.0104414256883432,
        "text": "<p>Razão pela qual, considerando o objeto delimitado pelo Autor/Recorrente, não se verificam os requisitos para a admissibilidade do recurso para uniformização de jurisprudência.</p>"
    },
    {
        "score": 0.9759188660223997,
        "text": "<p>Não se admite, pois, o recurso para uniformização de jurisprudência em apreço.</p>"
    },
    {
        "score": null,
        "text": "<p><strong>Interpretação/Aplicação do art. 199.º, n.º 1, 2.ª parte, do CPC</strong></p>"
    },
    {
        "score": 1.045591643565881,
        "text": "<p>A segunda questão objeto do pedido de uniformização de jurisprudência respeita à interpretação/aplicação do regime constante do art. 199.º, n.º 1, 2.ª parte do CPC, no sentido ou conteúdo de pensamento que lhe foi atribuído pelo acórdão do Supremo Tribunal de Justiça de 4 de fevereiro de 2020, por estar em contradição com o acórdão do mesmo Tribunal de 29 de abril de 2014 (proc. n.º 1937/07.1TBVCD.P1.S1), do qual o Recorrente juntou cópia.</p>"
    },
    {
        "score": 1.0395543403927663,
        "text": "<p>Segundo o art. 199.º, n.º 1, do CPC, o prazo para arguir a nulidade, na falta de disposição especial, é de dez dias contados (quando a parte não estiver presente no momento em que for cometida) “<em>do dia em que, depois de cometida a nulidade, a parte interveio em algum ato praticado no processo ou foi notificada para qualquer termo dele, mas neste último caso só quando deva presumir-se que então tomou conhecimento da nulidade ou quando dela pudesse conhecer, agindo com a devida diligência</em>”.</p>"
    },
    {
        "score": 1.0242098314074268,
        "text": "<p>Resulta dos arts. 149.º, n.º 1, e 199.º, n.º 1, do CPC, que se não esteve presente no momento em que a nulidade foi cometida, a parte dispõe de dez dias para a invocar, contados da sua intervenção em ato processual subsequente ou da notificação para qualquer termo do processo, mas, no último caso, apenas quando for de presumir que então tomou conhecimento dessa nulidade ou que dela pode aperceber-se. Isto é, na primeira hipótese, se a parte não estiver presente quando a nulidade foi cometida, o prazo conta-se, sem mais, a partir da primeira intervenção subsequente da parte no processo.</p>"
    },
    {
        "score": null,
        "text": "<p>Com efeito, “<em>(…) quando não esteja presente no ato em que a nulidade foi cometida, a parte dispõe do prazo de 10 dias (art 149.º, n.º 1) para a respetiva invocação, contando-se tal prazo de uma das circunstâncias seguintes: da sua intervenção em qualquer ato processual subsequente ou da notificação para qualquer termo do processo. Assim, no primeiro caso, a mera intervenção processual marca o início do prazo da arguição, o que significa que a parte tem o ónus de, por via da consulta dos autos, detetar o vício, sob pena de preclusão. No segundo caso, não basta a simples notificação para marcar o início do prazo, impondo-se ainda que seja de presumir que a parte, em face da notificação, tomou conhecimento da nulidade ou se pode aperceber da mesma (…)</em> ”.</p>"
    },
    {
        "score": 1.047082128170361,
        "text": "<p>Numa análise dos pressupostos substantivos de admissibilidade do recurso para uniformização de jurisprudência, importa verificar se existe ou não a invocada contradição na interpretação/aplicação do regime do art. 199.º, n.º 1, do CPC, decidida no acórdão recorrido.</p>"
    },
    {
        "score": 1.0567766215692174,
        "text": "<p>A este respeito evidenciam-se, desde logo, diferenças entre a matéria de facto subjacente a cada um dos acórdãos em alegada oposição que indiciam não se verificarem os requisitos de admissibilidade do recurso, antes se tratando de um caso de subsunção de diferentes situações concretas à previsão ou hipótese das mesmas normas jurídicas – ou, até, a diferentes situações típicas (intervenção em qualquer ato praticado no processo e notificação para qualquer termo do processo, desde que, no último caso, se deva presumir que então a parte tomou conhecimento da nulidade ou quando dela pudesse conhecer, agindo com a devida diligência) cuja verificação desencadeia a consequência jurídica estabelecida na estatuição (início do decurso do prazo de dez dias para a arguição da nulidade).</p>"
    },
    {
        "score": 1.027897670009459,
        "text": "<p>Na verdade, no acórdão recorrido estava em causa a falta de notificação do Autor do pagamento intempestivo, efetuado sem acréscimo de multa, da taxa de justiça devida, por parte dos Réus/Recorridos.</p>"
    },
    {
        "score": 1.0307679215487946,
        "text": "<p>Já no acórdão-fundamento se curava da nulidade decorrente de uma deficiência da gravação da prova, insuscetível de ser detetada pelos mandatários mediante a sua intervenção nos autos, que não resulta da consulta dos autos e que só é descoberta no momento da audição das gravações para a elaboração das alegações de recurso.</p>"
    },
    {
        "score": 1.059319528129181,
        "text": "<p>Mas ainda que tal diferenciação fáctica não fosse bastante para afastar a admissibilidade do recurso em apreço, sempre se teria de concluir que a questão erigida pelos Autor/Recorrente – saber se é necessário o conhecimento, efetivo ou presumido, da nulidade para ter lugar o início da contagem do prazo de dez dias – não conheceu diferentes respostas por parte dos acórdãos em confronto.</p>"
    },
    {
        "score": 1.0350416734879948,
        "text": "<p>No acórdão-fundamento, o Supremo Tribunal de Justiça aplicou à arguição da nulidade decorrente da deficiência da gravação da prova a regra consagrada no art. 205.º, n.º 1, 2.ª parte, <em>in fine</em>, do CPC de 1961 – que corresponde ao atual art. 199.º, n.º 1, 2.ª parte, <em>in fine</em>. Considerou, assim, que não era suficiente a simples notificação da parte para determinar o início da contagem do prazo de dez dias, impondo-se ainda que seja de presumir que o a parte, perante a notificação, tomou conhecimento da nulidade ou dela se pode aperceber.</p>"
    },
    {
        "score": 0.9507853735484786,
        "text": "<p>A invocação da nulidade em causa foi enquadrada na situação típica referida na parte final do segundo inciso do n.º 1 do art. 205.º do CPC pré-vigente (que era em tudo similar ao segundo inciso do n.º 1 do art. 199.º do atual CPC). Compreende-se, neste contexto, a referência colhida pelo Autor/Recorrente no acórdão-fundamento: “<em>Evidentemente que para que a parte possa e deva invocar a nulidade, será necessário que tenha conhecimento dela. Não faria qualquer sentido que a parte fosse obrigada a arguir nulidades que não conhecesse ou não tivesse obrigação de conhecer.</em>”</p>"
    },
    {
        "score": 1.0452135392789825,
        "text": "<p>Por seu turno, no acórdão recorrido, o Supremo Tribunal de Justiça aplicou à nulidade derivada da falta de notificação do Autor do pagamento intempestivo, sem acréscimo de multa, da taxa de justiça subsequente, pelos Réus, a regra plasmada na 1.ª parte do segundo inciso do n.º 1 do art. 199.º do CPC. Deste modo, o prazo de dez dias para invocar qualquer nulidade decorrente da referida falta de notificação começou a correr a 4 de abril de 2017, data em que o Autor/Recorrente inequivocamente interveio no processo, impondo-se-lhe que averiguasse então da existência de qualquer vício processual entretanto ocorrido. O Supremo Tribunal de Justiça, ao abrigo do art. 199.º, n.º 1, 1.ª parte do segundo inciso, do CPC, considerou irrelevante que o Autor/Recorrente dela não tivesse então tomado conhecimento.</p>"
    },
    {
        "score": 1.0041854160190542,
        "text": "<p>Não se verificam, por conseguinte, os requisitos para a admissão do recurso para uniformização de jurisprudência interposto pelo Autor.</p>"
    },
    {
        "score": 0.9759188660223997,
        "text": "<p>Não se admite, pois, o recurso para uniformização de jurisprudência em apreço.</p>"
    },
    {
        "score": null,
        "text": "<p><strong>IV - Decisão</strong></p>"
    },
    {
        "score": 0.881146604994437,
        "text": "<p>Pelo exposto, acorda-se em indeferir a reclamação e em confirmar o despacho reclamado, não admitindo, por conseguinte:</p>"
    },
    {
        "score": 0.9306730919561677,
        "text": "<p>o recurso para uniformização de jurisprudência que tem por objeto a interpretação/aplicação do art. 671.º, n.º 2, als. a) e b), do CPC;</p>"
    },
    {
        "score": 1.0183555067834942,
        "text": "<p>o recurso para uniformização de jurisprudência que tem por objeto a interpretação/aplicação do regime plasmado no art. 199.º, n.º 1, 2.ª parte, do CPC.</p>"
    },
    {
        "score": null,
        "text": "<p>Custas pelos Autor/Recorrente.</p>"
    },
    {
        "score": null,
        "text": "<p>Lisboa, 17 de novembro de 2020</p>"
    },
    {
        "score": null,
        "text": "<p><strong><span class=\"smallcaps\">Sumário</span></strong>: <strong>1.</strong> A primeira questão objeto do pedido de uniformização de jurisprudência respeita aos fundamentos legais da admissão de recurso de revista de acórdão do Tribunal da Relação que, não apreciando decisão interlocutória do Tribunal de 1.ª Instância que incida apenas sobre a relação processual, no sentido ou conteúdo de pensamento que o Supremo Tribunal de Justiça, no acórdão de 4 de fevereiro de 2020, retirou do texto do art. 671.º, n.º 2, als a) e b), do CPC, por estar em contradição com o acórdão do mesmo Tribunal de 29 de janeiro de 2018. <strong>2.</strong> A consideração do recurso de revista interposto à luz do art. 671.º, n.º 4, do CPC - por se tratar de recurso de um acórdão do Tribunal da Relação que não apreciou uma decisão interlocutória do Tribunal de 1.ª Instância, mas antes de recurso de um acórdão do Tribunal da Relação que apreciou uma questão processual suscitada pela primeira vez -, não integra o segmento decisório do acórdão recorrido. Isto inviabiliza a possibilidade de dela interpor recurso para uniformização de jurisprudência. <strong>3</strong>. Em todo o caso, mesmo que se considerasse que tal não impede o conhecimento do requerimento em causa, sempre importaria verificar se existe – ou não - a invocada contradição jurisprudencial no que respeita à subsunção ao n.º 4 do art. 671.º do CPC de recurso de revista de acórdão do Tribunal da Relação que recaia unicamente sobre a relação processual, mas que não aprecia uma decisão interlocutória do Tribunal de 1.ª Instância que incida apenas sobre a relação processual. <strong>4.</strong> Na medida em que ambos os arestos – acórdão recorrido e acórdão-fundamento - afirmam que o recurso de revista interposto à luz do art. 671.º, n.º 2, do CPC, tem por objeto acórdãos do Tribunal da Relação que apreciem decisões interlocutórias proferidas pelo Tribunal de 1.ª Instância que recaiam unicamente sobre a relação processual, desde que verificados os requisitos previstos nas als. a) ou b) do mesmo preceito, não se verifica qualquer contradição sobre a mesma questão fundamental de direito. <strong>5.</strong> Também não se verificam os pressupostos do recurso para uniformização de jurisprudência quando a questão erigida pelo recorrente – saber se é necessário o conhecimento, efetivo ou presumido, da nulidade para ter lugar o início da contagem do prazo de dez dias – não conheceu diferentes respostas por parte dos acórdãos em confronto.</p>"
    },
    {
        "score": null,
        "text": "<p>Este acórdão obteve o voto de conformidade dos Excelentíssimos Senhores Conselheiros Adjuntos António Magalhães e Fernando Dias, a quem o respetivo projeto já havia sido apresentado, e que não o assinam por, em virtude das atuais circunstâncias de pandemia de covid-19, provocada pelo coronavírus Sars-Cov-2, não se encontrarem presentes (art. 15.º-A do DL n.º 10-A/2020, de 13 de março, que lhe foi aditado pelo DL n.º 20/2020, de 1 de maio).</p>"
    },
    {
        "score": null,
        "text": "<p>Cfr., por todos, <span class=\"smallcaps\">António dos Santos Abrantes Geraldes</span>, <em>Recursos no Novo Código de Processo Civil</em>, Coimbra, Almedina, 2018, pp. 471-476.<a class=\"footnote-back\" href=\"#fnref1\" role=\"doc-backlink\">↩︎</a></p>"
    },
    {
        "score": null,
        "text": "<p>Cfr. Acórdão do Supremo Tribunal de Justiça de 25 de outubro de 2018 (<span class=\"smallcaps\">Maria da Graça Trigo</span>), proc. n.º 17728/15.3T8PRT-A.S1), cujo sumário se encontra disponível in www.stj.pt; Acórdão do Supremo Tribunal de Justiça de 10 de janeiro de 2019 (<span class=\"smallcaps\">Rosa Tching</span>), proc. n.º 1522/13.9TBGMR.G1.S2-A; Acórdão do Supremo Tribunal de Justiça de 10 de janeiro de 2019 (<span class=\"smallcaps\">Rosa Tching)</span>, proc. n.º 2183/14.3TBPTM.E2.S1-A, estes últimos ainda inéditos.</p>"
    },
    {
        "score": null,
        "text": "<p>Pressuposto fundamental de admissibilidade do recurso em apreço é, assim, a existência de uma contradição decisória entre dois acórdãos proferidos pelo Supremo Tribunal de Justiça, no domínio da mesma legislação e sobre a mesma questão fundamental de direito. Não se afigura necessário que os julgados em contradição se revelem frontalmente opostos, sendo suficiente que as soluções adotadas sejam diferentes, que não sejam as mesmas. Cfr. <span class=\"smallcaps\">Jorge Henrique Pinto Furtado</span>, <em>Recursos em Processo Civil (de acordo com o CPC de 2013)</em>, Lisboa, Nova Causa – Edições Jurídicas, 2017, pp.185-186. Importa, pois, que as decisões - e não os respetivos fundamentos – versem sobre a mesma questão de direito, e que esta haja sido objeto de decisão tanto no acórdão recorrido como no acórdão fundamento e, em todo o caso, que essa oposição seja afirmada e não subentendida, ou puramente implícita.</p>"
    },
    {
        "score": null,
        "text": "<p>Outrossim, é necessário que a questão de direito apreciada se revele decisiva para as soluções perfilhadas num e noutro acórdão, desconsiderando-se argumentos ou razões que não encerrem relevância determinante.</p>"
    },
    {
        "score": null,
        "text": "<p>Exige-se ainda a identidade substancial do núcleo essencial das situações de facto que suportam a aplicação, necessariamente diversa, das mesmas normas ou institutos jurídicos, devendo as soluções em confronto, necessariamente divergentes, respaldar-se no “domínio da mesma legislação”.<a class=\"footnote-back\" href=\"#fnref2\" role=\"doc-backlink\">↩︎</a></p>"
    },
    {
        "score": null,
        "text": "<p>Adotada no sumário do Acórdão do Supremo Tribunal de Justiça de 2 de outubro de 2014 (<span class=\"smallcaps\">Lopes do Rego</span>), proc. n.º 268/03.0TBVPA.P2.S1-A – disponível para consulta in - <a href=\"http://www.dgsi.pt/jstj.nsf/954f0ce6ad9dd8b980256b5f003fa814/33b6bd1b9eea161380257d650054fb4b?OpenDocument\">http://www.dgsi.pt/jstj.nsf/954f0ce6ad9dd8b980256b5f003fa814/33b6bd1b9eea161380257d650054fb4b?OpenDocument</a>. Este aresto é mencionado por <span class=\"smallcaps\">António Abrantes Geraldes</span>, <em>Recursos no Novo Código de Processo Civil</em>, Almedina, Coimbra, 2018, p.477, como uma síntese do que de essencial é exigível para a admissibilidade do recurso extraordinário para uniformização de jurisprudência.<a class=\"footnote-back\" href=\"#fnref3\" role=\"doc-backlink\">↩︎</a></p>"
    },
    {
        "score": null,
        "text": "<p><em>Vide</em> <span class=\"smallcaps\">António Santos Abrantes Geraldes/Paulo Pimenta/Luís Filipes Pires de Sousa</span>, <em>Código de Processo Civil Anotado</em>, Vol. I, Coimbra, Almedina, 2018, p.238.<a class=\"footnote-back\" href=\"#fnref4\" role=\"doc-backlink\">↩︎</a></p>"
    }
]
//showResponse(r);
