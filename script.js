        const modal = document.getElementById('modalOrcamento');
        const btnOpen = document.getElementById('btnOrcamento');
        const btnClose = document.querySelector('.close-btn');
        const steps = document.querySelectorAll('.step');
        const btnsNext = document.querySelectorAll('.next-step');
        const btnsPrev = document.querySelectorAll('.prev-step');
        let currentStep = 0;

        let bairrosData = [];

        // Carregar JSON de bairros para o Autocomplete
        fetch('cal_dist.json')
            .then(response => response.json())
            .then(data => {
                bairrosData = data.bairros;
                const datalist = document.getElementById('listaBairros');
                bairrosData.forEach(b => {
                    const option = document.createElement('option');
                    option.value = b.bairro;
                    datalist.appendChild(option);
                });
            })
            .catch(err => console.error('Erro ao carregar cal_dist.json:', err));

        // Abrir Modal
        btnOpen.addEventListener('click', (e) => {
            e.preventDefault();
            modal.style.display = 'flex';
        });

        // Fechar Modal
        const closeModal = () => { 
            modal.style.display = 'none'; 
            document.getElementById('formOrcamento').style.display = 'block';
            document.getElementById('resultadoOrcamento').style.display = 'none';
            document.getElementById('formOrcamento').reset();
            currentStep = 0;
            updateSteps();
        };
        btnClose.addEventListener('click', closeModal);
        // Removido o fechamento ao clicar fora para evitar que o usuario perca dados sem querer

        // Navegação de Passos
        const updateSteps = () => {
            steps.forEach((step, index) => {
                step.classList.toggle('active', index === currentStep);
            });
        };

        // Validação de Campos Obrigatórios
        const isStepValid = (stepIndex) => {
            const step = steps[stepIndex];
            const requiredFields = step.querySelectorAll('input[required], select[required]');
            let valid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    field.classList.add('invalid');
                    valid = false;
                } else {
                    field.classList.remove('invalid');
                }
                
                // Remove a marcação vermelha assim que o usuário digita algo
                field.addEventListener('input', () => field.classList.remove('invalid'), {once: true});
            });
            return valid;
        };

        btnsNext.forEach(btn => {
            btn.addEventListener('click', () => {
                if (isStepValid(currentStep)) {
                    if (currentStep < steps.length - 1) { 
                        currentStep++; 
                        updateSteps(); 
                    }
                } else {
                    alert("Por favor, preencha todos os campos destacados em vermelho.");
                }
            });
        });

        btnsPrev.forEach(btn => {
            btn.addEventListener('click', () => {
                if (currentStep > 0) { currentStep--; updateSteps(); }
            });
        });

        // RN05 - Gerenciar as opções de Quantidade de Entregas baseado no Pacote
        document.getElementById('petVolume').addEventListener('change', (e) => {
            const dias = parseInt(e.target.value);
            const qtdEntregasEl = document.getElementById('qtdEntregas');
            qtdEntregasEl.innerHTML = '<option value="">Quantidade de Entregas</option>';
            qtdEntregasEl.disabled = false;

            if (dias === 7) {
                qtdEntregasEl.innerHTML += '<option value="1">1 Entrega (Pacote total)</option>';
            } else if (dias === 15) {
                qtdEntregasEl.innerHTML += '<option value="1">1 Entrega (Pacote total)</option>';
                qtdEntregasEl.innerHTML += '<option value="2">2 Entregas (1 por semana)</option>';
            } else if (dias === 30) {
                qtdEntregasEl.innerHTML += '<option value="1">1 Entrega (Pacote total)</option>';
                qtdEntregasEl.innerHTML += '<option value="2">2 Entregas (1 a cada 15 dias)</option>';
                qtdEntregasEl.innerHTML += '<option value="4">4 Entregas (1 por semana)</option>';
            } else {
                qtdEntregasEl.innerHTML = '<option value="">Selecione primeiro os Dias do Pacote</option>';
                qtdEntregasEl.disabled = true;
            }
        });

        // Processar Regras de Negócios e Calcular
        document.getElementById('formOrcamento').addEventListener('submit', (e) => {
            e.preventDefault();
            if (!isStepValid(currentStep)) return;

            // Captura de Dados
            const peso = parseFloat(document.getElementById('petPeso').value);
            const idade = parseFloat(document.getElementById('petIdade').value);
            const dias = parseInt(document.getElementById('petVolume').value);
            const saude = document.getElementById('petSaude').value;
            const statusPeso = document.getElementById('petStatusPeso').value;
            const refeicoes = parseInt(document.getElementById('petRefeicoes').value);
            const entregas = parseInt(document.getElementById('qtdEntregas').value) || 1;
            const pagamento = document.getElementById('pagamentoForma').value;

            // RN01 - Volume da Dieta (4% do peso ao dia)
            const consumoDiarioGramas = (peso * 1000) * 0.04;
            const volumeTotalGramas = consumoDiarioGramas * dias;

            // RN02 - Precificação Dinâmica (Matriz)
            let precoGrama = 0;
            if (peso <= 4) {
                precoGrama = (dias === 7) ? 0.070 : (dias === 15) ? 0.065 : 0.060;
            } else if (peso <= 9) {
                precoGrama = (dias === 7) ? 0.065 : (dias === 15) ? 0.060 : 0.055;
            } else if (peso <= 14) {
                precoGrama = (dias === 7) ? 0.060 : (dias === 15) ? 0.055 : 0.050;
            } else {
                precoGrama = (dias === 7) ? 0.055 : (dias === 15) ? 0.050 : 0.045;
            }
            const custoDieta = volumeTotalGramas * precoGrama;

            // RN03 - Taxa de Consulta Especializada
            let taxaConsulta = 0;
            if (idade < 1 || idade > 10) {
                taxaConsulta = 60.00; // Gatilho Automático
            } else if (saude !== "Nenhuma" || statusPeso !== "Ideal") {
                // Gatilho Sugerido
                const aceite = confirm("Notamos uma condição de saúde ou necessidade de ajuste de peso.\nSugerimos adicionar uma consulta especializada por R$ 60,00 ao pacote para garantir a nutrição ideal.\n\nDeseja adicionar a consulta?");
                if (aceite) taxaConsulta = 60.00;
            }

            // RN04 - Taxa de Fracionamento
            const taxaFracionamento = (refeicoes > 1) ? ((refeicoes - 1) * 0.20 * dias) : 0;

            // RN05 - Logística e Frete (Cálculo Dinâmico via JSON)
            const bairroInput = document.getElementById('clienteBairro').value;
            const bairroEncontrado = bairrosData.find(b => b.bairro.toLowerCase() === bairroInput.toLowerCase());
            
            let distancia = bairroEncontrado ? bairroEncontrado.distancia_km : 999;
            let freteBase = 0;
            
            if (bairroEncontrado) {
                if (distancia <= 5) freteBase = 10.00;
                else if (distancia <= 10) freteBase = 15.00;
                else if (distancia <= 15) freteBase = 20.00;
                else if (distancia <= 20) freteBase = 25.00;
                else freteBase = 0; // Acima de 20 km = sob consulta
            } else {
                freteBase = 0; // Bairro não encontrado = sob consulta
            }

            const freteTotal = freteBase * entregas;

            // RN06 - Formação do Preço Final
            const valorBase = custoDieta + taxaConsulta + taxaFracionamento + freteTotal;
            const precoFinal = (pagamento === "Cartão") ? (valorBase / 0.95) : valorBase; // Matemática: Valor final suporta o desconto de 5% no PIX

            // Renderizar Resultados
            document.getElementById('formOrcamento').style.display = 'none';
            document.getElementById('resultadoOrcamento').style.display = 'block';

            const formatBRL = (valor) => `R$ ${valor.toFixed(2).replace('.', ',')}`;
            
            document.getElementById('resValor').innerText = formatBRL(precoFinal);

            // Exibe o aviso se a taxa de consulta foi aplicada
            const avisoConsultaEl = document.getElementById('resAvisoConsulta');
            if (taxaConsulta > 0) {
                avisoConsultaEl.style.display = 'block';
            } else {
                avisoConsultaEl.style.display = 'none';
            }

            // --- Geração do arquivo payLoad.json ---
            const payload = {
                cliente: {
                    nome: document.getElementById('tutorNome').value,
                    cpf: document.getElementById('tutorCPF').value,
                    whatsapp: document.getElementById('tutorTelefone').value,
                    email: document.getElementById('tutorEmail').value,
                    bairro: bairroInput
                },
                pet: {
                    nome: document.getElementById('petNome').value,
                    raca: document.getElementById('petRaca').value,
                    idade: idade,
                    peso: peso,
                    genero: document.getElementById('petGenero').value,
                    experiencia: document.getElementById('petExperiencia').value
                },
                saude: {
                    condicaoEspecial: saude,
                    statusPeso: statusPeso
                },
                pedido: {
                    diasPacote: dias,
                    refeicoesPorDia: refeicoes,
                    qtdEntregas: entregas,
                    freteBase: freteBase,
                    freteTotal: freteTotal,
                    formaPagamento: pagamento,
                    distanciaKm: distancia !== 999 ? distancia : null
                },
                orcamento_resultado: {
                    custoBaseDieta: parseFloat(custoDieta.toFixed(2)),
                    taxaConsulta: parseFloat(taxaConsulta.toFixed(2)),
                    taxaFracionamento: parseFloat(taxaFracionamento.toFixed(2)),
                    taxaFrete: parseFloat(freteTotal.toFixed(2)),
                    valorTotalFinal: parseFloat(precoFinal.toFixed(2))
                },
                dataCriacao: new Date().toISOString()
            };

            // Salvando no "banco de dados" do próprio navegador
            
            localStorage.setItem('payLoad', JSON.stringify(payload, null, 2));
            console.log("Dados do orçamento armazenados no LocalStorage:", payload);

            // --- INTEGRAÇÃO COM FORMSPREE ---

            const formspreeUrl = 'https://formspree.io/f/xykbzpga';
            
            fetch(formspreeUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json' 
                },
                body: JSON.stringify(payload)
            })
            .then(response => console.log('Orçamento enviado para o e-mail com sucesso via Formspree!'))
            .catch(err => console.error('Erro de conexão ao enviar para o Formspree:', err));
        });
