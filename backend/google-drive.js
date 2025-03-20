const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

/**
 * ATENÇÃO:
 * O acesso ao Google Drive via API requer um arquivo de credenciais (JSON) de uma
 * conta de serviço gerado no Google Cloud Console. Você deve colocar esse arquivo
 * em C:\dudatrudes\config\credentials.json.
 *
 * Depois, compartilhe a pasta do seu Google Drive com o e-mail
 * da conta de serviço para permitir o upload.
 */

// Caminho para o arquivo de credenciais
const CREDENTIALS_PATH = 'C:/dudatrudes/config/credentials.json';

// Função para autorizar e criar um cliente autenticado com a API do Google Drive
async function authorize() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const { client_email, private_key } = credentials;

    const auth = new google.auth.JWT(
        client_email,
        null,
        private_key,
        ['https://www.googleapis.com/auth/drive']
    );

    return auth;
}

// Função para criar uma pasta no Google Drive
async function createFolder(folderName) {
    try {
        const auth = await authorize();
        const drive = google.drive({ version: 'v3', auth });
        const fileMetadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder'
        };
        const response = await drive.files.create({
            resource: fileMetadata,
            fields: 'id'
        });
        console.log(`Pasta "${folderName}" criada com ID: ${response.data.id}`);
        return response.data.id;
    } catch (error) {
        console.error('Erro ao criar pasta no Google Drive:', error);
        throw error;
    }
}

// Função para enviar um arquivo para uma pasta específica no Google Drive
async function uploadFile(folderId, filePath, fileName) {
    try {
        const auth = await authorize();
        const drive = google.drive({ version: 'v3', auth });
        const fileMetadata = {
            name: fileName,
            parents: [folderId]
        };
        const media = {
            mimeType: getMimeType(filePath),
            body: fs.createReadStream(filePath)
        };
        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id'
        });
        console.log(`Arquivo "${fileName}" enviado com ID: ${response.data.id}`);
        return response.data.id;
    } catch (error) {
        console.error('Erro ao enviar arquivo para o Google Drive:', error);
        throw error;
    }
}

// Função auxiliar para determinar o mimeType com base na extensão do arquivo
function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.png':
            return 'image/png';
        case '.gif':
            return 'image/gif';
        case '.mp4':
            return 'video/mp4';
        default:
            return 'application/octet-stream';
    }
}

// Exporta as funções para uso em outros módulos
module.exports = {
    createFolder,
    uploadFile
};
