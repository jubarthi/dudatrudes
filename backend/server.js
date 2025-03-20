const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

// Importa funções do WhatsApp (envio de mensagens e armazenamento em JSON)
const { enviarMensagem, salvarDados } = require('./whatsapp-bot');
// Importa funções de integração com o Google Drive
const { createFolder, uploadFile } = require('./google-drive');

const app = express();

// Habilita CORS para permitir requisições de qualquer origem (útil para testes com frontend via live-server)
app.use(cors());

// Middleware para interpretar JSON em requisições (não multipart)
app.use(express.json());

/**
 * Configuração do Multer usando diskStorage para manter a extensão original dos arquivos.
 * Os arquivos serão armazenados na pasta: C:/dudatrudes/backend/uploads/
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'C:/dudatrudes/backend/uploads/');
  },
  filename: (req, file, cb) => {
    // Extrai a extensão original
    const ext = path.extname(file.originalname);
    // Obtém o nome base (sem extensão) e substitui espaços por _
    const baseName = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    // Cria um nome único usando timestamp para evitar colisões
    const finalName = `${baseName}-${Date.now()}${ext}`;
    cb(null, finalName);
  }
});
const upload = multer({ storage });

/**
 * ROTA /enviar:
 * - Recebe dados do convidado (nome, sobrenome, whatsapp, nascimento) via JSON.
 * - Envia mensagem para a aniversariante e o responsável.
 * - Armazena os dados localmente (dados_convidados.json).
 */
app.post('/enviar', (req, res) => {
  const { nome, sobrenome, whatsapp, nascimento } = req.body;

  const mensagem = `*CONVIDADO COMPARTILHOU*\n` +
                   `Nome: ${nome} ${sobrenome}\n` +
                   `WhatsApp: ${whatsapp}\n` +
                   `Data de Nascimento: ${nascimento}\n` +
                   `Data e horário do envio: ${new Date().toLocaleString()}`;

  // Números dos destinatários: aniversariante e responsável
  const numeroAniversariante = '5513996136266';
  const numeroOrganizador = '5513974111690';

  // Envia as mensagens via WhatsApp
  enviarMensagem(numeroAniversariante, mensagem);
  enviarMensagem(numeroOrganizador, mensagem);

  // Armazena os dados do convidado em dados_convidados.json
  salvarDados({
    nome,
    sobrenome,
    whatsapp,
    nascimento,
    dataEnvio: new Date().toISOString()
  });

  return res.json({
    status: 'ok',
    mensagem: 'Dados enviados e armazenados com sucesso!'
  });
});

/**
 * ROTA /compartilhar:
 * - Recebe campos de texto e arquivos (fotos/vídeos) enviados via multipart/form-data.
 * - Cria uma pasta no Google Drive (nome padrão: Nome_Sobrenome_DataNascimento).
 * - Faz o upload de cada arquivo para essa pasta no Drive.
 * - Envia mensagem de agradecimento para o convidado e aviso para a aniversariante e responsável.
 * - Armazena os dados do convidado junto com o ID da pasta criada.
 */
app.post('/compartilhar', upload.array('arquivos'), async (req, res) => {
  try {
    const { nome, sobrenome, whatsapp, nascimento } = req.body;
    const files = req.files; // Array com os arquivos enviados (com extensão preservada)

    // Cria uma pasta no Google Drive com o padrão: Nome_Sobrenome_DataNascimento
    const folderName = `${nome}_${sobrenome}_${nascimento}`;
    const folderId = await createFolder(folderName);

    // Faz o upload de cada arquivo para a pasta criada no Drive
    for (const file of files) {
      // file.path: caminho local do arquivo (com nome único e extensão preservada)
      // file.originalname: nome original do arquivo (mantém a extensão)
      await uploadFile(folderId, file.path, file.originalname);
    }

    // Monta a mensagem de aviso para os destinatários
    const mensagemAviso = `*CONVIDADO COMPARTILHOU*\n` +
                          `Nome: ${nome} ${sobrenome}\n` +
                          `WhatsApp: ${whatsapp}\n` +
                          `Data de Nascimento: ${nascimento}\n` +
                          `Data e horário do envio: ${new Date().toLocaleString()}\n` +
                          `Arquivos enviados para a pasta: ${folderName}`;

    const numeroAniversariante = '5513996136266';
    const numeroOrganizador = '5513974111690';

    // Envia mensagem de agradecimento para o próprio convidado
    await enviarMensagem(whatsapp, `Obrigado por compartilhar suas fotos e vídeos, ${nome}!`);

    // Envia a mensagem de aviso para a aniversariante e o responsável
    await enviarMensagem(numeroAniversariante, mensagemAviso);
    await enviarMensagem(numeroOrganizador, mensagemAviso);

    // Armazena os dados do convidado com o ID da pasta criada
    salvarDados({
      nome,
      sobrenome,
      whatsapp,
      nascimento,
      dataEnvio: new Date().toISOString(),
      folderId
    });

    return res.json({
      status: 'ok',
      mensagem: 'Fotos e vídeos enviados com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao compartilhar arquivos:', error);
    return res.status(500).json({
      status: 'erro',
      mensagem: 'Erro ao compartilhar arquivos.'
    });
  }
});

// Inicia o servidor na porta 3000
app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
