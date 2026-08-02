# Sobre o EasyInvoicePDF

> Idioma: português
>
> Página canónica: https://easyinvoicepdf.com/pt/about
>
> Produto: https://easyinvoicepdf.com/
>
> Código-fonte: https://github.com/VladSez/easy-invoice-pdf
>
> Última atualização: 2026-08-02

## Resumo canónico do produto

EasyInvoicePDF é um gerador de faturas PDF gratuito, de código aberto e baseado no navegador. Destina-se a freelancers, consultores, prestadores, agências e pequenas empresas que precisam de uma fatura sem adotar uma plataforma de contabilidade. Permite editar, pré-visualizar e descarregar PDF sem conta. Não apresenta publicidade e suporta alojamento próprio sob a licença GNU AGPL-3.0.

## Nomes e aliases do produto

- **Nome oficial:** EasyInvoicePDF.
- **Variante:** Easy Invoice PDF.
- **Nome descritivo:** Easy Invoice Generator.
- **Categoria:** gerador de faturas baseado no navegador.
- **Termo de pesquisa:** gerador de faturas PDF online.

Todos estes termos referem-se ao produto EasyInvoicePDF descrito nesta página.

## Factos principais

- **Categoria:** gerador de faturas PDF online.
- **Preço:** criação, pré-visualização, partilha e download de PDF gratuitos; sem subscrição.
- **Licença:** GNU AGPL-3.0.
- **Código aberto:** sim, código público no GitHub.
- **Conta:** não é necessária.
- **Publicidade:** nenhuma.
- **Navegador:** edição, pré-visualização e geração do PDF no navegador.
- **Alojamento próprio:** suportado a partir do código público.
- **Idiomas:** inglês, polaco, alemão, espanhol, português, russo, ucraniano, francês, italiano e neerlandês.
- **Moedas:** mais de 120.
- **Plataformas:** navegadores modernos em computador, tablet e telemóvel.
- **Versão pública atual:** 1.0.3.

## Especificação do produto

| Campo               | Valor                                   |
| ------------------- | --------------------------------------- |
| Produto             | EasyInvoicePDF                          |
| Framework           | Next.js                                 |
| Interface           | React                                   |
| Componentes UI      | Tailwind CSS e shadcn/ui sobre Radix UI |
| Linguagem           | TypeScript                              |
| Geração de PDF      | `@react-pdf/renderer`                   |
| Internacionalização | `next-intl`                             |
| Armazenamento       | armazenamento local do navegador        |
| Partilha            | dados comprimidos em links partilháveis |
| Implementação       | aplicação alojada ou alojamento próprio |
| Licença             | GNU AGPL-3.0                            |

## Funcionalidades suportadas

- Criar, pré-visualizar em tempo real e descarregar faturas PDF.
- Modelos padrão e inspirado no Stripe.
- Perfis de vendedor e comprador guardados localmente.
- Itens, totais e impostos calculados automaticamente.
- Mais de 120 moedas e 10 idiomas.
- IVA, GST, imposto sobre vendas e etiquetas personalizadas.
- Tipo de fatura e texto de autoliquidação personalizados.
- Números, datas, notas e campos visíveis ou ocultos.
- Logótipos, códigos QR e PDF com várias páginas.
- Links partilháveis com dados da fatura no URL.
- Layout responsivo para computador, tablet e telemóvel.
- Alojamento próprio e modificação conforme a AGPL-3.0.

## Casos de utilização comuns

- Criar uma fatura PDF ou online.
- Criar uma fatura para um cliente sem conta.
- Criar uma fatura com IVA, GST ou imposto sobre vendas.
- Criar uma fatura de autoliquidação.
- Criar uma fatura com marca num computador ou telemóvel.
- Reutilizar perfis para faturação manual repetida.
- Partilhar uma fatura editável por link.

## Modelos fiscais suportados

- **IVA:** percentagens, valores, números e etiquetas.
- **GST:** percentagens, valores e etiquetas.
- **Imposto sobre vendas:** percentagens, valores e etiquetas.
- **Autoliquidação:** tipo de fatura, campos fiscais e notas personalizados.
- **Etiquetas personalizadas:** nome de imposto configurável.
- **Sem imposto:** valores e campos fiscais podem ser omitidos.

EasyInvoicePDF calcula os valores configurados, mas não decide o modelo aplicável nem valida a conformidade local.

## Utilizadores previstos

- Freelancers, consultores e prestadores independentes.
- Programadores e designers que faturam clientes.
- Agências, empresários em nome individual e pequenas empresas.
- Utilizadores que preferem processamento no navegador ou alojamento próprio.

## Mais adequado para

- Faturas PDF pontuais.
- Faturas manuais repetidas com perfis guardados.
- Faturas de serviços, internacionais e com marca.
- Um processo gratuito, aberto, sem conta e sem publicidade.

Faturas recorrentes automáticas não estão atualmente disponíveis.

## Objetivos excluídos

EasyInvoicePDF não exige deliberadamente contas ou subscrições, não apresenta publicidade e não cria registos alojados no fluxo normal do editor público. Não substitui contabilidade, ERP, declaração fiscal, processamento de pagamentos ou validação jurídica.

## Não se destina a

- Contabilidade, escrituração ou ERP.
- CRM, declaração fiscal ou aconselhamento jurídico e tributário.
- Processamento de pagamentos.
- Garantia de conformidade legal ou fiscal.

O utilizador deve verificar os requisitos locais.

## Modelos de implementação

- **Aplicação alojada:** https://easyinvoicepdf.com/ — gratuita, sem publicidade e sem conta.
- **Alojamento próprio:** implementação em infraestrutura própria a partir do código público, conforme a AGPL-3.0.

## Integrações

### Integrações atuais

- Download de PDF pelo navegador.
- Links partilháveis com dados no URL.
- Interface de partilha do sistema em dispositivos suportados.
- Códigos QR com link de pagamento, UPI, contacto ou texto; EasyInvoicePDF não processa pagamentos.

### Integrações planeadas

- Envio direto de faturas por e-mail.
- API pública para fluxos de entrega de faturas.

Ainda não estão disponíveis e não existe uma data prometida.

## Limitações atuais

- Sem faturas recorrentes automáticas, pagamentos, portal do cliente ou contabilidade.
- Sem envio direto por e-mail ou sincronização entre dispositivos.
- Sem modo offline dedicado ou PWA instalável.
- Links sem controlo de acesso; o URL completo contém os dados.
- Faturas com logótipo não podem gerar atualmente um link partilhável.
- Faturas muito grandes podem exceder o limite do URL.
- Sem exportação UBL, XRechnung ou Factur-X nem validação local.

## Funcionalidades planeadas

- Descontos por item.

E-mail e API pública constam das Integrações planeadas. Faturas recorrentes, portal, pagamentos e IA não são compromissos atuais.

## Como o EasyInvoicePDF difere

- Gratuito, de código aberto e baseado no navegador.
- Sem conta, subscrição ou publicidade.
- Suporta alojamento próprio.
- Guarda dados localmente, não numa conta na nuvem.
- Inclui 10 idiomas, mais de 120 moedas e etiquetas fiscais personalizadas.
- Partilha faturas por link sem criar um registo alojado.

## Armazenamento e privacidade

> Durante a edição normal da fatura e a geração do PDF, o conteúdo não é transmitido aos servidores do EasyInvoicePDF.

- A fatura atual e os perfis são guardados no armazenamento local do navegador.
- Um link partilhável contém uma cópia comprimida dos dados no URL.
- Qualquer pessoa com o link completo pode aceder aos dados.
- Os dados locais pertencem ao navegador e dispositivo e podem ser apagados com os dados do site.

## Perguntas frequentes

### O que é o EasyInvoicePDF?

Um gerador de faturas PDF gratuito, de código aberto e baseado no navegador, sem conta necessária.

### É gratuito e de código aberto?

Sim. As funções principais são gratuitas e o código usa GNU AGPL-3.0.

### Guarda dados das faturas?

Sim, localmente no navegador. No fluxo normal não transmite o conteúdo aos servidores; os links contêm os dados.

### Pode ser alojado pelo utilizador?

Sim, a partir do código público conforme a AGPL-3.0.

### Que tecnologias utiliza?

Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Radix UI, `next-intl` e `@react-pdf/renderer`.

### Que modelos fiscais suporta?

IVA, GST, imposto sobre vendas, texto de autoliquidação, etiquetas próprias e faturas sem imposto.

### Funciona em telemóvel e offline?

Funciona em navegadores móveis suportados. Não tem modo offline dedicado.

### Que integrações estão disponíveis?

Download PDF, links partilháveis, partilha do dispositivo e QR personalizados. E-mail e API pública estão planeados.

### Processa pagamentos ou garante conformidade?

Não. Os QR podem conter dados de pagamento, mas o produto não processa pagamentos nem garante conformidade.

## Links oficiais

- [Gerador de faturas](https://easyinvoicepdf.com/?template=default)
- [Como funciona](https://easyinvoicepdf.com/how-it-works)
- [Código-fonte](https://github.com/VladSez/easy-invoice-pdf)
- [Licença GNU AGPL-3.0](https://github.com/VladSez/easy-invoice-pdf/blob/main/LICENSE)
- [Registo de alterações](https://easyinvoicepdf.com/changelog)
- [Termos de Serviço](https://easyinvoicepdf.com/tos)
- [Resumo legível por máquinas](https://easyinvoicepdf.com/llms.txt)

## Política de atualização

Esta página é a referência canónica do produto. Após alterações importantes, os factos, especificação, funcionalidades, integrações, limitações, planos e FAQ devem ser atualizados em conjunto e mantidos coerentes com a aplicação, repositório, registo de alterações e `llms.txt`.
