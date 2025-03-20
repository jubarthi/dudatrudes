// script.js

document.addEventListener('DOMContentLoaded', () => {
    // === Lógica para a página form.html ===
    const formDados = document.getElementById('formDados');
    if (formDados) {
      formDados.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('nome').value;
        const sobrenome = document.getElementById('sobrenome').value;
        const whatsapp = document.getElementById('whatsapp').value;
        const nascimento = document.getElementById('nascimento').value;
  
        try {
          // Envia os dados para /enviar (rota do backend que dispara mensagens e salva no JSON)
          const response = await fetch('http://localhost:3000/enviar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, sobrenome, whatsapp, nascimento })
          });
  
          const result = await response.json();
          if (result.status === 'ok') {
            alert('Dados enviados! Agora vamos selecionar suas fotos e vídeos.');
            // Armazena dados no sessionStorage para usar na próxima página
            sessionStorage.setItem('nome', nome);
            sessionStorage.setItem('sobrenome', sobrenome);
            sessionStorage.setItem('whatsapp', whatsapp);
            sessionStorage.setItem('nascimento', nascimento);
  
            // Redireciona para a página de upload
            window.location.href = 'upload.html';
          } else {
            alert('Ocorreu um erro ao enviar os dados.');
          }
        } catch (error) {
          console.error('Erro ao enviar dados:', error);
          alert('Erro ao enviar dados. Verifique se o servidor está rodando.');
        }
      });
    }
  
    // === Lógica para a página upload.html ===
    const btnEnviar = document.getElementById('btnEnviar');
    if (btnEnviar) {
      btnEnviar.addEventListener('click', async () => {
        const checkGaleria = document.getElementById('checkGaleria');
        if (!checkGaleria.checked) {
          alert('Você precisa autorizar o acesso à galeria antes de enviar!');
          return;
        }
  
        // Exibe o input de arquivos (caso ainda esteja oculto)
        const arquivosInput = document.getElementById('arquivos');
        arquivosInput.style.display = 'block';
  
        // Verifica se o usuário selecionou arquivos
        if (!arquivosInput.files.length) {
          alert('Por favor, selecione suas fotos ou vídeos antes de enviar!');
          return;
        }
  
        // Recupera dados do sessionStorage
        const nome = sessionStorage.getItem('nome') || '';
        const sobrenome = sessionStorage.getItem('sobrenome') || '';
        const whatsapp = sessionStorage.getItem('whatsapp') || '';
        const nascimento = sessionStorage.getItem('nascimento') || '';
  
        // Monta o FormData para envio
        const formData = new FormData();
        formData.append('nome', nome);
        formData.append('sobrenome', sobrenome);
        formData.append('whatsapp', whatsapp);
        formData.append('nascimento', nascimento);
  
        for (let i = 0; i < arquivosInput.files.length; i++) {
          formData.append('arquivos', arquivosInput.files[i]);
        }
  
        // Exibe a barra de progresso
        const progressContainer = document.getElementById('progressContainer');
        const progressBar = document.getElementById('progressBar');
        progressContainer.style.display = 'block';
        progressBar.style.width = '0%';
  
        try {
          // Envia tudo para /compartilhar (rota que faz upload ao Drive e envia mensagens)
          const response = await fetch('http://localhost:3000/compartilhar', {
            method: 'POST',
            body: formData
          });
  
          // Simulação de progresso (a Fetch API não fornece eventos de progresso nativamente)
          let progress = 0;
          const interval = setInterval(() => {
            if (progress < 100) {
              progress += 10;
              progressBar.style.width = progress + '%';
            } else {
              clearInterval(interval);
            }
          }, 500);
  
          const result = await response.json();
          clearInterval(interval);
          progressBar.style.width = '100%';
  
          if (result.status === 'ok') {
            alert('Obrigado por compartilhar esse momento incrível!');
            // Opcional: fechar a janela ou redirecionar para uma página de "Obrigado".
            window.close();
          } else {
            alert('Ocorreu um erro ao enviar seus arquivos: ' + result.mensagem);
          }
        } catch (error) {
          console.error('Erro ao enviar arquivos:', error);
          alert('Erro ao enviar arquivos. Verifique se o servidor está rodando.');
        }
      });
  
      // Exibe/esconde o input de arquivos conforme o checkbox
      const checkGaleria = document.getElementById('checkGaleria');
      checkGaleria.addEventListener('change', () => {
        const arquivosInput = document.getElementById('arquivos');
        if (checkGaleria.checked) {
          arquivosInput.style.display = 'block';
        } else {
          arquivosInput.style.display = 'none';
        }
      });
    }
  });
  