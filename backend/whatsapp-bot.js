const fs = require('fs');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Caminho para o arquivo onde serão salvos os dados dos convidados
const caminhoArquivoJSON = 'C:/dudatrudes/config/dados_convidados.json';

// Se o arquivo não existir, cria-o com um array vazio
if (!fs.existsSync(caminhoArquivoJSON)) {
    fs.writeFileSync(caminhoArquivoJSON, '[]');
}

// Inicializa o cliente do WhatsApp Web com autenticação local
const client = new Client({
    authStrategy: new LocalAuth()
});

// Evento para gerar e exibir o QR Code para autenticação
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log("Escaneie o QR Code no WhatsApp para conectar (celular da assessoria).");
});

// Evento acionado quando o bot estiver pronto
client.on('ready', () => {
    console.log('Bot do WhatsApp (assessoria) está pronto e conectado!');
});

// Função para enviar mensagem via WhatsApp
const enviarMensagem = async (numero, mensagem) => {
    try {
        await client.sendMessage(numero, mensagem);
        console.log(`Mensagem enviada para ${numero}`);
    } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
    }
};

// Função para salvar os dados dos convidados em um arquivo JSON
const salvarDados = (dados) => {
    try {
        // Lê o conteúdo atual do arquivo e converte em array
        const conteudo = fs.readFileSync(caminhoArquivoJSON, 'utf-8').trim();
        let convidados = JSON.parse(conteudo);

        // Adiciona os novos dados ao array
        convidados.push(dados);

        // Salva os dados atualizados no arquivo JSON com formatação legível
        fs.writeFileSync(caminhoArquivoJSON, JSON.stringify(convidados, null, 4));
        console.log("Dados salvos em 'dados_convidados.json'.");
    } catch (error) {
        console.error("Erro ao salvar dados no JSON:", error);
    }
};

// Exporta as funções para uso em outros módulos
module.exports = { client, enviarMensagem, salvarDados };

// Inicializa o cliente do WhatsApp
client.initialize();
