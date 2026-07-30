// =====================================================
// SEMÁFORO INCLUSIVO - JavaScript
// =====================================================

// ---------- ELEMENTOS DOM ----------
const luzVerde = document.getElementById('verde');
const luzAmarela = document.getElementById('amarelo');
const luzVermelha = document.getElementById('vermelho');
const statusDiv = document.getElementById('status');

const btnIniciar = document.getElementById('btnIniciar');
const btnParar = document.getElementById('btnParar');
const btnProximo = document.getElementById('btnProximo');

// ---------- ESTADO ----------
const ESTADOS = {
    VERDE: 'verde',
    AMARELO: 'amarelo',
    VERMELHO: 'vermelho'
};

let estadoAtual = ESTADOS.VERDE;
let temporizador = null;
let cicloAtivo = false;
const TEMPO_VERDE = 5000;    // 5 segundos
const TEMPO_AMARELO = 2000;  // 2 segundos
const TEMPO_VERMELHO = 5000; // 5 segundos

// ---------- ÁUDIO (Web Audio API) ----------
let audioContext = null;

function inicializarAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function tocarSom(frequencia, duracao = 300) {
    try {
        inicializarAudio();
        const oscilador = audioContext.createOscillator();
        const ganho = audioContext.createGain();
        oscilador.connect(ganho);
        ganho.connect(audioContext.destination);
        oscilador.frequency.value = frequencia;
        oscilador.type = 'sine';
        ganho.gain.value = 0.15;
        oscilador.start();
        oscilador.stop(audioContext.currentTime + duracao / 1000);
    } catch (e) {
        // Fallback silencioso se o áudio não estiver disponível
        console.log('Áudio indisponível');
    }
}

// ---------- FUNÇÃO PRINCIPAL: ATUALIZAR SEMÁFORO ----------
function atualizarSemaforo(estado) {
    // Remove classe ativa de todos
    luzVerde.classList.remove('ativo');
    luzAmarela.classList.remove('ativo');
    luzVermelha.classList.remove('ativo');

    // Remove classes de status
    statusDiv.classList.remove('siga', 'atencao', 'pare');

    // Aplica estado
    switch (estado) {
        case ESTADOS.VERDE:
            luzVerde.classList.add('ativo');
            statusDiv.textContent = '🟢 SIGA';
            statusDiv.classList.add('siga');
            tocarSom(523, 200); // Dó
            break;

        case ESTADOS.AMARELO:
            luzAmarela.classList.add('ativo');
            statusDiv.textContent = '🟡 ATENÇÃO';
            statusDiv.classList.add('atencao');
            tocarSom(659, 300); // Mi
            break;

        case ESTADOS.VERMELHO:
            luzVermelha.classList.add('ativo');
            statusDiv.textContent = '🔴 PARE';
            statusDiv.classList.add('pare');
            tocarSom(784, 400); // Sol
            break;

        default:
            break;
    }

    estadoAtual = estado;
    atualizarAriaLabel();
}

// ---------- ACESSIBILIDADE: ARIA ----------
function atualizarAriaLabel() {
    const descricoes = {
        [ESTADOS.VERDE]: 'Semáforo verde: siga. Luz azul com formato de círculo.',
        [ESTADOS.AMARELO]: 'Semáforo amarelo: atenção. Luz amarela com formato de triângulo.',
        [ESTADOS.VERMELHO]: 'Semáforo vermelho: pare. Luz laranja com formato de quadrado.'
    };
    const semaforoEl = document.querySelector('.semaforo');
    semaforoEl.setAttribute('aria-label', descricoes[estadoAtual] || 'Semáforo inclusivo');
}

// ---------- PRÓXIMO ESTADO ----------
function proximoEstado() {
    const estados = [ESTADOS.VERDE, ESTADOS.AMARELO, ESTADOS.VERMELHO];
    const idx = estados.indexOf(estadoAtual);
    const proximoIdx = (idx + 1) % estados.length;
    atualizarSemaforo(estados[proximoIdx]);
}

// ---------- CICLO AUTOMÁTICO ----------
function iniciarCiclo() {
    if (cicloAtivo) return;

    // Garante que começamos no verde
    atualizarSemaforo(ESTADOS.VERDE);
    cicloAtivo = true;
    btnIniciar.textContent = '⏳ Rodando...';
    btnIniciar.disabled = true;
    btnProximo.disabled = true;

    let estado = ESTADOS.VERDE;

    function avancar() {
        if (!cicloAtivo) return;

        switch (estado) {
            case ESTADOS.VERDE:
                estado = ESTADOS.AMARELO;
                atualizarSemaforo(ESTADOS.AMARELO);
                temporizador = setTimeout(avancar, TEMPO_AMARELO);
                break;

            case ESTADOS.AMARELO:
                estado = ESTADOS.VERMELHO;
                atualizarSemaforo(ESTADOS.VERMELHO);
                temporizador = setTimeout(avancar, TEMPO_VERMELHO);
                break;

            case ESTADOS.VERMELHO:
                estado = ESTADOS.VERDE;
                atualizarSemaforo(ESTADOS.VERDE);
                temporizador = setTimeout(avancar, TEMPO_VERDE);
                break;

            default:
                break;
        }
    }

    temporizador = setTimeout(avancar, TEMPO_VERDE);
}

// ---------- PARAR CICLO ----------
function pararCiclo() {
    cicloAtivo = false;
    if (temporizador) {
        clearTimeout(temporizador);
        temporizador = null;
    }
    btnIniciar.textContent = '▶ Iniciar Ciclo';
    btnIniciar.disabled = false;
    btnProximo.disabled = false;
}

// ---------- RESET (Vai para verde e para) ----------
function resetSemaforo() {
    pararCiclo();
    atualizarSemaforo(ESTADOS.VERDE);
}

// ---------- EVENTOS DOS BOTÕES ----------
btnIniciar.addEventListener('click', () => {
    inicializarAudio(); // ativa áudio no clique do usuário
    iniciarCiclo();
});

btnParar.addEventListener('click', () => {
    pararCiclo();
    // Mantém a luz atual acesa, mas pausa o ciclo
    btnIniciar.textContent = '▶ Iniciar Ciclo';
    btnIniciar.disabled = false;
    btnProximo.disabled = false;
});

btnProximo.addEventListener('click', () => {
    if (cicloAtivo) {
        // Se o ciclo está rodando, não permitimos avanço manual
        return;
    }
    inicializarAudio();
    proximoEstado();
});

// ---------- TECLADO (Acessibilidade) ----------
document.addEventListener('keydown', (e) => {
    // Espaço: Iniciar/Parar (toggle)
    if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        if (cicloAtivo) {
            pararCiclo();
            btnIniciar.textContent = '▶ Iniciar Ciclo';
            btnIniciar.disabled = false;
            btnProximo.disabled = false;
        } else {
            inicializarAudio();
            iniciarCiclo();
        }
    }

    // Seta para direita: Próximo estado (se não estiver em ciclo automático)
    if (e.key === 'ArrowRight' && !cicloAtivo) {
        e.preventDefault();
        inicializarAudio();
        proximoEstado();
    }
});

// ---------- INICIALIZAÇÃO ----------
// Começa no verde
atualizarSemaforo(ESTADOS.VERDE);

// Mensagem no console (para o professor)
console.log('🚦 Semáforo Inclusivo carregado!');
console.log('♿ Teclas: Espaço = Iniciar/Parar | → = Próximo');
console.log('🔵 Verde = Azul + Círculo | 🟡 Amarelo = Triângulo | 🟠 Vermelho = Laranja + Quadrado');