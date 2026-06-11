from pathlib import Path
import textwrap

from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "deliverables" / "EBOOK_RV_TRINCA_RV21_FINAL.pdf"
LOGO = ROOT / "public" / "images" / "logorv.jpg"
FACE = ROOT / "public" / "images" / "ruria-rosto-premium.png"
PRODUCT = ROOT / "public" / "images" / "trinca-rv21-produto.png"
PROFILE = ROOT / "public" / "images" / "ruriaaa.jpg"
HERO = ROOT / "public" / "images" / "ruria.jpg"

W, H = A4
M = 46

BLACK = "#090908"
INK = "#181511"
MUTED = "#6F685E"
GOLD = "#D7B65D"
GOLD_DARK = "#8C6A20"
PAPER = "#F6F0E4"
SOFT = "#EDE2CE"
LINE = "#D8C79C"
WHITE = "#FFFFFF"


def hex_to_rgb(value):
    value = value.strip("#")
    return tuple(int(value[i : i + 2], 16) / 255 for i in (0, 2, 4))


def fill(c, color):
    c.setFillColorRGB(*hex_to_rgb(color))


def stroke(c, color):
    c.setStrokeColorRGB(*hex_to_rgb(color))


def draw_full_image(c, path, alpha=1):
    if not path.exists():
        return
    img = ImageReader(str(path))
    iw, ih = img.getSize()
    scale = max(W / iw, H / ih)
    dw, dh = iw * scale, ih * scale
    x, y = (W - dw) / 2, (H - dh) / 2
    c.saveState()
    c.setFillAlpha(alpha)
    c.drawImage(img, x, y, dw, dh, preserveAspectRatio=True, mask="auto")
    c.restoreState()


def draw_internal_background(c):
    fill(c, PAPER)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    fill(c, BLACK)
    c.setFillAlpha(0.035)
    c.circle(W - 60, 70, 170, fill=1, stroke=0)
    c.setFillAlpha(1)
    if LOGO.exists():
        c.saveState()
        c.setFillAlpha(0.055)
        c.drawImage(ImageReader(str(LOGO)), W - 148, 54, 86, 86, mask="auto")
        c.restoreState()


def draw_header(c, page, title="EBOOK RV"):
    draw_internal_background(c)
    fill(c, MUTED)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(M, H - 24, "TRINCA RV21")
    c.drawRightString(W - M, H - 24, title)
    stroke(c, LINE)
    c.setLineWidth(0.35)
    c.line(M, H - 31, W - M, H - 31)
    fill(c, MUTED)
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(W / 2, 20, f"@ruriavirginio  |  {page:02d}")


def title(c, text, y, color=GOLD_DARK, size=22):
    fill(c, color)
    c.setFont("Helvetica-Bold", size)
    c.drawString(M, y, text)
    return y - size - 12


def subtitle(c, text, y, color=INK, size=13):
    fill(c, color)
    c.setFont("Helvetica-Bold", size)
    c.drawString(M, y, text)
    return y - size - 8


def didactic_strip(c, y, items=("ENTENDA", "APLIQUE", "REPITA")):
    gap = 8
    box_w = (W - 2 * M - gap * 2) / 3
    box_h = 31
    for i, item in enumerate(items):
        x = M + i * (box_w + gap)
        fill(c, BLACK if i == 1 else SOFT)
        stroke(c, LINE)
        c.roundRect(x, y - box_h, box_w, box_h, 7, fill=1, stroke=1)
        fill(c, GOLD if i == 1 else GOLD_DARK)
        c.setFont("Helvetica-Bold", 8.5)
        c.drawCentredString(x + box_w / 2, y - 19, item)
    return y - box_h - 14


def mini_note(c, heading, body, y):
    fill(c, SOFT)
    stroke(c, LINE)
    c.roundRect(M, y - 64, W - 2 * M, 64, 9, fill=1, stroke=1)
    fill(c, GOLD_DARK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(M + 14, y - 20, heading.upper())
    paragraph(c, body, M + 14, y - 38, width_chars=78, size=10.2, leading=13)
    return y - 78


def wrap_text(text, chars):
    lines = []
    for paragraph in text.split("\n"):
        if not paragraph.strip():
            lines.append("")
            continue
        lines.extend(textwrap.wrap(paragraph, width=chars, break_long_words=False))
    return lines


def paragraph(c, text, x, y, width_chars=82, size=10.5, color=INK, leading=15):
    fill(c, color)
    c.setFont("Helvetica", size)
    for line in wrap_text(text, width_chars):
        if line:
            c.drawString(x, y, line)
        y -= leading
    return y


def bullet_list(c, items, x, y, width_chars=76, size=11, leading=15.5):
    fill(c, INK)
    for item in items:
        lines = wrap_text(item, width_chars)
        fill(c, GOLD_DARK)
        c.setFont("Helvetica-Bold", size)
        c.drawString(x, y, "•")
        fill(c, INK)
        c.setFont("Helvetica", size)
        c.drawString(x + 15, y, lines[0])
        y -= leading
        for line in lines[1:]:
            c.drawString(x + 15, y, line)
            y -= leading
        y -= 2
    return y


def card(c, x, y, w, h, heading, body, fill_color=SOFT):
    fill(c, fill_color)
    stroke(c, LINE)
    c.setLineWidth(0.8)
    c.roundRect(x, y - h, w, h, 9, fill=1, stroke=1)
    fill(c, GOLD_DARK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(x + 14, y - 20, heading.upper())
    return paragraph(c, body, x + 14, y - 39, width_chars=max(27, int(w / 6.5)), size=10.2, leading=13.2)


def lesson_card(c, x, y, w, h, heading, meaning, practice):
    fill(c, "#FFFFFF")
    stroke(c, LINE)
    c.setLineWidth(0.8)
    c.roundRect(x, y - h, w, h, 9, fill=1, stroke=1)
    fill(c, GOLD_DARK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(x + 14, y - 20, heading.upper())
    fill(c, MUTED)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(x + 14, y - 38, "O QUE É")
    y2 = paragraph(c, meaning, x + 14, y - 51, width_chars=max(27, int(w / 6.5)), size=9.5, leading=12)
    fill(c, MUTED)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(x + 14, y2 - 2, "NA PRÁTICA")
    paragraph(c, practice, x + 14, y2 - 15, width_chars=max(27, int(w / 6.5)), size=9.5, leading=12)


def two_col_cards(c, rows, y):
    gap = 14
    w = (W - 2 * M - gap) / 2
    h = 113
    x1, x2 = M, M + w + gap
    for i, (heading, body) in enumerate(rows):
        x = x1 if i % 2 == 0 else x2
        card(c, x, y, w, h, heading, body)
        if i % 2 == 1:
            y -= h + 14
    if len(rows) % 2:
        y -= h + 14
    return y


def method_grid(c, rows, y):
    gap = 10
    w = (W - 2 * M - gap) / 2
    h = 96
    for i, (heading, body) in enumerate(rows):
        x = M if i % 2 == 0 else M + w + gap
        card(c, x, y, w, h, heading, body, fill_color="#FFFFFF")
        if i % 2 == 1:
            y -= h + 11
    if len(rows) % 2:
        y -= h + 11
    return y


def lesson_grid(c, rows, y):
    gap = 10
    w = (W - 2 * M - gap) / 2
    h = 125
    for i, (heading, meaning, practice) in enumerate(rows):
        x = M if i % 2 == 0 else M + w + gap
        lesson_card(c, x, y, w, h, heading, meaning, practice)
        if i % 2 == 1:
            y -= h + 11
    if len(rows) % 2:
        y -= h + 11
    return y


def quote_box(c, text, y):
    fill(c, BLACK)
    stroke(c, BLACK)
    c.roundRect(M, y - 92, W - 2 * M, 92, 12, fill=1, stroke=0)
    fill(c, GOLD)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(M + 18, y - 24, "DECISÃO CENTRAL")
    paragraph(c, text, M + 18, y - 45, width_chars=72, size=10.9, color=WHITE, leading=15)
    return y - 112


def checklist(c, items, y):
    row_h = 34
    for item in items:
        fill(c, "#FFFFFF")
        stroke(c, LINE)
        c.roundRect(M, y - row_h, W - 2 * M, row_h, 6, fill=1, stroke=1)
        fill(c, GOLD_DARK)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(M + 14, y - 22, "□")
        paragraph(c, item, M + 39, y - 15, width_chars=74, size=10.4, leading=13)
        y -= row_h + 8
    return y


def page_cover(c):
    draw_full_image(c, HERO if HERO.exists() else FACE, alpha=1)
    fill(c, BLACK)
    c.setFillAlpha(0.48)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillAlpha(1)
    stroke(c, GOLD)
    c.setLineWidth(1.1)
    c.line(M, H - 58, W - M, H - 58)
    if LOGO.exists():
        c.drawImage(ImageReader(str(LOGO)), M, H - 146, 64, 64, mask="auto")
    fill(c, WHITE)
    c.setFont("Helvetica-Bold", 48)
    c.drawCentredString(W / 2, H - 340, "EBOOK RV")
    fill(c, GOLD)
    c.setFont("Helvetica-Bold", 23)
    c.drawCentredString(W / 2, H - 382, "TRINCA RV21")
    stroke(c, GOLD)
    c.setLineWidth(0.8)
    c.line(W / 2 - 92, H - 408, W / 2 + 92, H - 408)
    fill(c, GOLD)
    c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(W / 2, 92, "Ruriá Virgínio")
    fill(c, WHITE)
    c.setFont("Helvetica", 9.5)
    c.drawCentredString(W / 2, 70, "@ruriavirginio")


def build():
    OUT.parent.mkdir(exist_ok=True)
    c = canvas.Canvas(str(OUT), pagesize=A4)

    page_cover(c)
    c.showPage()

    draw_header(c, 2)
    y = title(c, "Antes de começar", H - 70)
    y = paragraph(
        c,
        "Este ebook não foi criado para ser apenas lido. Ele foi criado para orientar sua execução dentro do TRINCA RV21, para que você treine com mais consciência, menos improviso e mais compromisso com o processo.",
        M,
        y,
        width_chars=82,
        size=11.6,
        leading=17,
    )
    y -= 10
    y = quote_box(
        c,
        "Resultado não nasce de perfeição. Resultado nasce de repetição, presença e correção de rota. Você não precisa fazer tudo perfeito: precisa voltar para o plano todos os dias.",
        y,
    )
    y = didactic_strip(c, y + 4, ("1. LEIA", "2. APLIQUE", "3. REPITA"))
    y = subtitle(c, "Como usar este guia", y)
    bullet_list(
        c,
        [
            "Leia uma vez antes de iniciar os treinos.",
            "Volte aqui sempre que tiver dúvida sobre método, descanso, intensidade ou execução.",
            "Use os checklists para corrigir a postura mental e prática antes de treinar.",
            "Não misture este processo com várias estratégias externas ao mesmo tempo.",
        ],
        M,
        y,
    )
    c.showPage()

    draw_header(c, 3)
    y = title(c, "O método RV dentro do TRINCA", H - 70)
    y = paragraph(
        c,
        "O TRINCA RV21 transforma tentativa em direção. A aluna não precisa adivinhar o que fazer: ela precisa entender a lógica, aplicar com disciplina e repetir o processo até o corpo começar a responder.",
        M,
        y,
        size=11.7,
        leading=17,
    )
    y -= 8
    y = didactic_strip(c, y, ("DIREÇÃO", "EXECUÇÃO", "CONSTÂNCIA"))
    y = two_col_cards(
        c,
        [
            ("Direção", "Antes do treino: entenda o objetivo do dia e siga a ordem proposta."),
            ("Consciência", "Durante o treino: perceba respiração, postura, amplitude e músculo trabalhado."),
            ("Intensidade", "Nas séries: entregue esforço real sem perder técnica ou segurança."),
            ("Constância", "Depois do treino: registre, recupere e volte no próximo dia."),
        ],
        y,
    )
    y = quote_box(c, "O corpo responde melhor quando você para de negociar com o básico.", y + 10)
    c.showPage()

    draw_header(c, 4)
    y = title(c, "Princípios que realmente importam", H - 70)
    y = paragraph(
        c,
        "Treinar melhor não é apenas fazer mais exercícios. É compreender como o corpo responde aos estímulos e como pequenas decisões repetidas mudam o resultado.",
        M,
        y,
        size=11.4,
        leading=16.2,
    )
    y -= 8
    lesson_grid(
        c,
        [
            ("Individualidade", "Cada corpo responde em um ritmo.", "Compare sua execução de hoje com a sua de ontem, não com outra pessoa."),
            ("Sobrecarga", "O corpo precisa de estímulo progressivo.", "Evolua carga, controle ou repetições sem sacrificar técnica."),
            ("Adaptação", "O corpo se acostuma ao que se repete.", "Quando ficar fácil demais, ajuste estímulo com orientação."),
            ("Continuidade", "Frequência sustenta resultado.", "Não espere motivação perfeita: cumpra o próximo treino possível."),
            ("Especificidade", "Cada objetivo pede estratégia.", "Siga a dieta e o treino do objetivo escolhido na inscrição."),
            ("Recuperação", "Descanso também constrói resultado.", "Sono, água e alimentação fazem parte do protocolo."),
        ],
        y,
    )
    c.showPage()

    draw_header(c, 5)
    y = title(c, "Execução: onde o resultado começa", H - 70)
    y = paragraph(
        c,
        "A execução é onde muita gente perde resultado sem perceber. O movimento precisa ter controle, amplitude segura e intenção. Fazer rápido demais, roubar movimento ou treinar sem atenção reduz a qualidade do estímulo.",
        M,
        y,
        size=11.6,
        leading=17,
    )
    y -= 10
    y = didactic_strip(c, y, ("POSTURA", "CONTROLE", "INTENÇÃO"))
    y = subtitle(c, "Checklist da boa execução", y)
    y = checklist(
        c,
        [
            "Sei qual músculo estou tentando trabalhar.",
            "Consigo controlar a descida e a subida do movimento.",
            "Não estou usando impulso para terminar a repetição.",
            "Minha respiração está organizada.",
            "A carga desafia, mas não destrói minha técnica.",
        ],
        y,
    )
    y = quote_box(c, "Se a carga faz você perder postura, amplitude e controle, ela deixou de ser ferramenta de evolução e virou distração.", y)
    mini_note(c, "Correção imediata", "Reduza a carga, respire melhor, ajuste a postura e recomece a série com mais controle.", y + 6)
    c.showPage()

    draw_header(c, 6)
    y = title(c, "Intensidade sem confusão", H - 70)
    y = paragraph(
        c,
        "Intensidade não é treinar de qualquer jeito até ficar exausta. Intensidade é entregar esforço com técnica. O ponto certo é quando as últimas repetições exigem foco, mas a forma continua limpa.",
        M,
        y,
        size=11.6,
        leading=17,
    )
    y -= 10
    y = didactic_strip(c, y, ("LEVE", "IDEAL", "EXCESSO"))
    y = two_col_cards(
        c,
        [
            ("Leve demais", "Sinal: você termina a série sem esforço real. Ajuste: aumente controle, repetição ou carga quando indicado."),
            ("Ponto ideal", "Sinal: as últimas repetições exigem foco. Ajuste: mantenha técnica limpa e respiração organizada."),
            ("Pesado demais", "Sinal: perde amplitude, postura ou sente dor inadequada. Ajuste: reduza carga imediatamente."),
            ("Correção", "Sinal: movimento ficou bagunçado. Ajuste: pare, reorganize e volte para execução correta."),
        ],
        y,
    )
    c.showPage()

    draw_header(c, 7)
    y = title(c, "Métodos aplicados no treino", H - 70)
    y = paragraph(
        c,
        "Os métodos abaixo organizam intensidade. Eles não são enfeite: cada um tem uma função. Use com atenção ao treino do dia e às orientações recebidas.",
        M,
        y,
        size=11.4,
        leading=16.2,
    )
    y -= 8
    lesson_grid(
        c,
        [
            ("Série simples", "Base do treino.", "Execute, descanse e repita antes de avançar."),
            ("Bi-set", "Dois exercícios seguidos.", "Faça a sequência com foco, sem transformar em pressa."),
            ("Tri-set", "Três exercícios seguidos.", "Use para aumentar densidade e resistência."),
            ("Drop set", "Redução de carga perto da falha.", "Diminua a carga e continue com controle."),
            ("Rest-pause", "Pausa curta para continuar.", "Respire, retome e preserve a técnica."),
            ("Falha muscular", "Limite da repetição limpa.", "Pare quando não conseguir manter segurança."),
        ],
        y,
    )
    c.showPage()

    draw_header(c, 8)
    y = title(c, "Conceitos rápidos para treinar melhor", H - 70)
    y = didactic_strip(c, y, ("CONCEITO", "AJUSTE", "EXECUÇÃO"))
    lesson_grid(
        c,
        [
            ("Cadência", "Velocidade do movimento.", "Controle a descida e a subida em vez de apenas completar repetição."),
            ("Amplitude", "Movimento completo e seguro.", "Não encurte sem necessidade; preserve postura e controle."),
            ("Progressão", "Aumentar estímulos aos poucos.", "Evolua carga ou repetição sem destruir a técnica."),
            ("Descanso", "Pausa que sustenta performance.", "Respeite o intervalo para manter qualidade nas séries."),
            ("Aquecimento", "Preparação para treinar melhor.", "Ative articulações e músculos antes de exigir intensidade."),
            ("Cardio", "Ferramenta de condicionamento.", "Use como apoio ao plano, sem substituir musculação e dieta."),
        ],
        y,
    )
    c.showPage()

    draw_header(c, 9)
    y = title(c, "Erros que travam evolução", H - 70)
    y = didactic_strip(c, y, ("IDENTIFIQUE", "CORRIJA", "VOLTE"))
    y = bullet_list(
        c,
        [
            "Começar forte demais e abandonar quando a rotina aperta.",
            "Trocar de estratégia antes de dar tempo ao corpo responder.",
            "Treinar sem registrar percepção, carga ou dificuldade.",
            "Fazer dieta perfeita por dois dias e desistir no primeiro deslize.",
            "Comparar seu início com o meio do processo de outra pessoa.",
            "Confundir cansaço emocional com incapacidade.",
        ],
        M,
        y,
        width_chars=82,
        size=11.3,
        leading=16.5,
    )
    y -= 12
    quote_box(c, "Um erro não destrói o processo. O que destrói o processo é usar o erro como desculpa para não voltar.", y)
    c.showPage()

    draw_header(c, 10)
    y = title(c, "O pacto dos 21 dias", H - 70)
    y = paragraph(
        c,
        "Durante o TRINCA RV21, o compromisso não é com uma versão impossível de você. O compromisso é com uma versão mais presente, mais firme e mais honesta na execução.",
        M,
        y,
        size=11.6,
        leading=17,
    )
    y -= 10
    y = mini_note(c, "Como preencher mentalmente este pacto", "Leia cada linha como uma decisão prática. O objetivo não é prometer perfeição, é assumir retorno rápido ao plano.", y)
    checklist(
        c,
        [
            "Vou cumprir o treino previsto ou comunicar minha adaptação quando necessário.",
            "Vou seguir a dieta do meu objetivo sem buscar atalhos confusos.",
            "Vou voltar para o plano depois de um erro, sem transformar deslize em desistência.",
            "Vou respeitar meu processo sem usar comparação como punição.",
            "Vou tratar esses 21 dias como uma decisão, não como uma tentativa solta.",
        ],
        y,
    )
    c.showPage()

    draw_header(c, 11)
    y = title(c, "Mensagem final", H - 70)
    y = paragraph(
        c,
        "Resultado é consequência de constância. Não existe transformação real sem processo, mas também não existe processo forte sem direção.",
        M,
        y,
        size=12.4,
        leading=18,
    )
    y -= 4
    y = paragraph(
        c,
        "Você agora tem uma base mais clara para treinar com inteligência, corrigir sua execução e continuar mesmo nos dias em que a motivação não aparecer.",
        M,
        y,
        size=11.6,
        leading=17,
    )
    y -= 18
    y = quote_box(c, "Você não entrou no TRINCA RV21 para provar algo para os outros. Você entrou para voltar a agir por você.", y)
    if LOGO.exists():
        c.drawImage(ImageReader(str(LOGO)), W / 2 - 36, y - 86, 72, 72, mask="auto")
    fill(c, GOLD_DARK)
    c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(W / 2, y - 118, "Ruriá Virgínio")
    fill(c, MUTED)
    c.setFont("Helvetica", 9)
    c.drawCentredString(W / 2, y - 136, "TRINCA RV21 | @ruriavirginio")
    c.showPage()

    c.save()
    print(OUT)


if __name__ == "__main__":
    build()
