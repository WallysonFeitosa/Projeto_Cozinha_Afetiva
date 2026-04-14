[README.md](https://github.com/user-attachments/files/26729854/README.md)
# Cozinha Pet Afetiva - Alimentação Natural

Este é o repositório do projeto **Cozinha Pet Afetiva**, uma landing page interativa focada em oferecer planos de alimentação 100% natural, balanceada e sob medida para pets. O projeto conta com um sistema de orçamento dinâmico em etapas (wizard).

---

## Estrutura do Site

O projeto foi desenvolvido utilizando tecnologias web padrão (**HTML5, CSS3 e JavaScript Vanilla**), sem o uso de frameworks complexos, garantindo alta performance e carregamento rápido.

A estrutura visual (Landing Page) está dividida nas seguintes seções:
- **Header/Navegação:** Menu fixo superior para navegação rápida.
- **Hero (Apresentação):** Chamada principal do site com o botão de CTA (Call to Action) para iniciar o orçamento.
- **Como Funciona:** Grid explicativo de 6 passos sobre o serviço.
- **Diferenciais (Por que escolher?):** Destaque para os valores do produto (Ingredientes naturais, Qualidade premium, etc.).
- **Footer (Rodapé):** Informações de contato e links para redes sociais (Instagram e WhatsApp).
- **Modal de Orçamento:** Uma janela sobreposta (overlay) contendo um formulário multi-etapas que calcula o valor do plano em tempo real.

---

## Road Map do Front-End (Fluxo do Usuário)

O fluxo de navegação do usuário foi desenhado para ser intuitivo e converter visitantes em leads qualificados:

1. **Descoberta:** O usuário acessa a página, lê a proposta de valor e entende como o serviço funciona.
2. **Ação (Orçamento):** Ao clicar em "Faça seu orçamento", um Modal se abre.
3. **Jornada de Preenchimento (Wizard em 4 Passos):**
   - **Passo 1 (Tutor):** Coleta de dados básicos e bairro de entrega (com autocomplete dinâmico buscando dados de um JSON).
   - **Passo 2 (Pet):** Dados do animal (Nome, Raça, Idade, Peso e Gênero).
   - **Passo 3 (Saúde):** Informações sobre restrições alimentares e status de peso atual.
   - **Passo 4 (Fechamento):** Escolha dos dias do pacote (7, 15 ou 30), quantidade de refeições diárias, número de entregas e forma de pagamento.
4. **Visualização do Resultado:** O formulário é ocultado e a tela exibe o valor final gerado, além de avisos caso taxas extras (como consulta nutricional) tenham sido aplicadas.
5. **Conversão:** Um botão finaliza o processo redirecionando o usuário para o WhatsApp com uma mensagem pré-configurada para concluir a compra.

---

## Lógica e Regras de Negócio

**toda a lógica de negócios e cálculos complexos rodam no lado do cliente (Client-side JavaScript)**. 

A arquitetura lógica é dividida nas seguintes Regras de Negócio (RNs):

### RN01 - Cálculo do Volume da Dieta
* A quantidade diária de alimento é estipulada em **4% do peso corporal do pet**.
* **Volume Total:** É calculado multiplicando a necessidade diária pelo número de dias do pacote escolhido (7, 15 ou 30).

### RN02 - Precificação Dinâmica (Matriz)
O valor do grama da alimentação varia de forma inversamente proporcional ao tamanho do pet e ao tempo de contrato (quanto maior o pet e maior o plano, menor o valor do grama):
* **Pets até 4kg:** R$ 0,060 a R$ 0,070 / grama
* **Pets de 4.1kg a 9kg:** R$ 0,055 a R$ 0,065 / grama
* **Pets de 9.1kg a 14kg:** R$ 0,050 a R$ 0,060 / grama
* **Pets acima de 14kg:** R$ 0,045 a R$ 0,055 / grama

### RN03 - Taxa de Consulta Especializada
Uma taxa de **R$ 60,00** é avaliada com base nos dados de saúde:
* **Gatilho Automático:** Aplicada diretamente se o pet tiver menos de 1 ano (filhote) ou mais de 10 anos (idoso).
* **Gatilho Sugerido:** Se o pet tiver alguma condição de saúde selecionada ou se não estiver no peso ideal, o sistema exibe um alerta (`confirm`) sugerindo a inclusão da consulta.

### RN04 - Taxa de Fracionamento
Caso o tutor deseje mais de 1 refeição por dia, cobra-se uma taxa de embalagem extra:
* **Fórmula:** `(Refeições - 1) * R$ 0,20 * Dias do Pacote`.

### RN05 - Logística e Frete Dinâmico (Integração JSON)
O cálculo do frete utiliza o arquivo `cal_dist.json`, que atua como um mini banco de dados contendo bairros de Recife, suas zonas e distâncias em relação à origem (Torre).
* **Até 5km:** R$ 10,00
* **Até 10km:** R$ 15,00
* **Até 15km:** R$ 20,00
* **Até 20km:** R$ 25,00
* **Acima de 20km / Não encontrado:** Sob consulta (Frete = 0).
* O valor base do frete é multiplicado pela quantidade de entregas solicitadas no pacote.

### RN06 - Formação do Preço Final
* O sistema soma: Custo da Dieta + Consulta + Fracionamento + Frete.
* Se o pagamento escolhido for **Cartão**, o sistema embute a taxa matemática equivalente ao desconto que seria dado no PIX (dividindo o total por 0.95, simulando um acréscimo de 5% sobre a base).

---

## Persistência e Integrações

Ao final do orçamento, o sistema gera um *Payload* JSON estruturado com todos os dados preenchidos e os cálculos gerados, realizando duas ações principais:

1. **Armazenamento Local:** Salva o Payload no `localStorage` do navegador, permitindo a retenção da informação (evitando perdas) ou uso futuro, caso a página seja recarregada.
2. **Integração com Formspree:** Dispara um POST via `fetch API` para o webhook do *Formspree*. Dessa forma, os donos da Cozinha Pet Afetiva recebem instantaneamente um e-mail com todos os dados do orçamento como se fosse um CRM básico, auxiliando no contato de venda final.
