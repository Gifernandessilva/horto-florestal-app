/* cspell:disable */
import { useState, useEffect, useCallback, useRef } from 'react';
import L from 'leaflet';

type Tab = 'inicio' | 'escalas' | 'territorios' | 'relatorios';
type ScheduleSubTab = 'meio_de_semana' | 'fim_de_semana' | 'servico';

interface TimeSession {
  id: string;
  memberId?: string;
  date: string;
  durationSec: number;
  revisitas: number;
  estudos: number;
  synced?: boolean;
}

interface MonthlyReportItem {
  id: string;
  memberId: string;
  monthYear: string;
  totalHours: number;
  revisitas: number;
  estudos: number;
  observacoes?: string;
  status: string;
}

interface AssignmentItem {
  id: string;
  cargo: string;
  data: string;
  local: string;
  status: string;
  memberId: string;
  member?: {
    id: string;
    name: string;
  };
}

interface MidweekPart {
  section: string;
  title: string;
  description?: string;
  assignee: string;
  assistant?: string;
}

interface MidweekMeetingItem {
  id: string;
  weekLabel: string;
  chairman: string;
  openingPrayer: string;
  closingPrayer: string;
  partsJson: string;
}

interface CleaningScheduleItem {
  id: string;
  weekLabel: string;
  groupName: string;
  notes?: string | null;
}

interface MemberProfile {
  id: string;
  name: string;
  phone: string;
  pin: string;
  role: string;
  monthlyGoal: number;
  yearlyGoal?: number;
  canUseTimer?: boolean;
  canViewAllHours?: boolean;
  canAssignParts?: boolean;
  serviceGroup: string;
  timeLogs?: TimeSession[];
  monthlyReports?: MonthlyReportItem[];
}

interface TerritoryItem {
  id: string;
  nome: string;
  quadras: number;
  status: string;
  responsavel: string;
  lat: number;
  lng: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const MES_ATUAL = '2026-11';
const DIAS_NOVEMBRO = 30;

const SEMANAS_PADRAO_HOURGLASS: MidweekMeetingItem[] = [
  {
    id: 'preset-2-8-nov',
    weekLabel: '2–8 de nov. de 2026',
    chairman: 'Marcos Silva',
    openingPrayer: 'Wdeyverson M. de Freitas',
    closingPrayer: 'Taylisson Mesquita',
    partsJson: JSON.stringify([
      {
        section: 'Cabecalho',
        title: 'quarta-feira, 4 de novembro de 2026 • JEREMIAS 50-51',
        description: 'Cântico 20: Você vai dar a eles o que precisam',
        assignee: 'Cântico 54: “Este é o caminho”',
      },
      {
        section: 'TESOUROS DA PALAVRA DE DEUS',
        title: '1. Jeová humilha os orgulhosos (10 min)',
        assignee: 'Marcos Silva',
      },
      {
        section: 'TESOUROS DA PALAVRA DE DEUS',
        title: '2. Joias espirituais (10 min)',
        assignee: 'Wdeyverson M. de Freitas',
      },
      {
        section: 'TESOUROS DA PALAVRA DE DEUS',
        title: '3. Leitura da Bíblia (4 min) Jer. 50:1-16 (th lição 8)',
        assignee: 'James',
      },
      {
        section: 'FAÇA SEU MELHOR NO MINISTÉRIO',
        title: '4. Iniciando conversas (3 min)',
        description: 'DE CASA EM CASA. Comece uma conversa amigável. (lmd lição 2 ponto 3)',
        assignee: 'Camila Medeiros',
        assistant: 'Léia',
      },
      {
        section: 'FAÇA SEU MELHOR NO MINISTÉRIO',
        title: '5. Cultivando o interesse (4 min)',
        description: 'TESTEMUNHO INFORMAL. Faça uma revisita. (lmd lição 7 ponto 4)',
        assignee: 'Rose Peres',
        assistant: 'Marta Silva',
      },
      {
        section: 'FAÇA SEU MELHOR NO MINISTÉRIO',
        title: '6. Discurso (5 min)',
        description: 'Tema: Confie no julgamento de Jeová. (th lição 14)',
        assignee: 'Taylisson Mesquita',
      },
      {
        section: 'NOSSA VIDA CRISTÃ',
        title: 'Cântico 38: Jeová te dará força',
        assignee: '',
      },
      {
        section: 'NOSSA VIDA CRISTÃ',
        title: '7. Necessidades locais (15 min) Consideração.',
        assignee: 'Aquiles A. de Oliveira',
      },
      {
        section: 'NOSSA VIDA CRISTÃ',
        title: '8. Estudo bíblico de congregação (30 min)',
        description: 'wcg cap. 15',
        assignee: 'Marcos Silva',
        assistant: 'Júlio César',
      },
      {
        section: 'ÁUDIO/VÍDEO & INDICADORES',
        title: 'Áudio',
        assignee: 'Anselmo',
        assistant: 'Áudio e Vídeo',
      },
      {
        section: 'ÁUDIO/VÍDEO & INDICADORES',
        title: 'Microfone Volante',
        assignee: 'James',
        assistant: 'Palco e Microfone',
        description: 'Gabriel S. Aguiar|Microfone',
      },
      {
        section: 'ÁUDIO/VÍDEO & INDICADORES',
        title: 'Indicador',
        assignee: 'Jesuino',
        assistant: 'Interno',
        description: 'Edgard|Externo',
      },
    ]),
  },
  {
    id: 'preset-9-15-nov',
    weekLabel: '9–15 de nov. de 2026',
    chairman: 'Aquiles A. de Oliveira',
    openingPrayer: 'Djonata Bertolini',
    closingPrayer: 'Valderimar C. Monteiro',
    partsJson: JSON.stringify([
      {
        section: 'Cabecalho',
        title: 'quarta-feira, 11 de novembro de 2026 • JEREMIAS 52',
        description: 'Cântico 24: Venha ao monte de Jeová',
        assignee: 'Cântico 61: Avancem, Testemunhas!',
      },
      {
        section: 'TESOUROS DA PALAVRA DE DEUS',
        title: '1. O cumprimento da Palavra de Jeová (10 min)',
        assignee: 'Djonata Bertolini',
      },
      {
        section: 'TESOUROS DA PALAVRA DE DEUS',
        title: '2. Joias espirituais (10 min)',
        assignee: 'Taylisson Mesquita',
      },
      {
        section: 'TESOUROS DA PALAVRA DE DEUS',
        title: '3. Leitura da Bíblia (4 min) Jer. 52:1-16 (th lição 9)',
        assignee: 'Sandro',
      },
      {
        section: 'FAÇA SEU MELHOR NO MINISTÉRIO',
        title: '4. Iniciando conversas (3 min)',
        description: 'TESTEMUNHO PÚBLICO. Use o carrinho ou mostruário. (lmd lição 3 ponto 4)',
        assignee: 'Leila',
        assistant: 'Izaltina G. Coelho',
      },
      {
        section: 'FAÇA SEU MELHOR NO MINISTÉRIO',
        title: '5. Cultivando o interesse (4 min)',
        description: 'DE CASA EM CASA. Mostre como funciona um estudo bíblico. (lmd lição 9 ponto 3)',
        assignee: 'Camila Medeiros',
        assistant: 'Vangela S. dos Santos',
      },
      {
        section: 'FAÇA SEU MELHOR NO MINISTÉRIO',
        title: '6. Fazendo discípulos (5 min)',
        description: 'Ajude o estudante a se preparar para a reunião. (th lição 11)',
        assignee: 'Wdeyverson M. de Freitas',
        assistant: 'Reginaldo',
      },
      {
        section: 'NOSSA VIDA CRISTÃ',
        title: 'Cântico 85: Recebam uns aos outros',
        assignee: '',
      },
      {
        section: 'NOSSA VIDA CRISTÃ',
        title: '7. Mantenha a lealdade sob provação (15 min) Consideração.',
        assignee: 'Valderimar C. Monteiro',
      },
      {
        section: 'NOSSA VIDA CRISTÃ',
        title: '8. Estudo bíblico de congregação (30 min)',
        description: 'wcg cap. 16',
        assignee: 'Aquiles A. de Oliveira',
        assistant: 'Anselmo',
      },
      {
        section: 'ÁUDIO/VÍDEO & INDICADORES',
        title: 'Áudio',
        assignee: 'Wdeyverson M. de Freitas',
        assistant: 'Áudio e Vídeo',
      },
      {
        section: 'ÁUDIO/VÍDEO & INDICADORES',
        title: 'Microfone Volante',
        assignee: 'Júlio César',
        assistant: 'Palco e Microfone',
        description: 'Reginaldo|Microfone',
      },
      {
        section: 'ÁUDIO/VÍDEO & INDICADORES',
        title: 'Indicador',
        assignee: 'Manoel',
        assistant: 'Interno',
        description: 'Sandro|Externo',
      },
    ]),
  },
  {
    id: 'preset-16-22-nov',
    weekLabel: '16–22 de nov. de 2026',
    chairman: 'Taylisson Mesquita',
    openingPrayer: 'Taylisson Mesquita',
    closingPrayer: 'Wdeyverson M. de Freitas',
    partsJson: JSON.stringify([
      {
        section: 'Cabecalho',
        title: 'quarta-feira, 18 de novembro de 2026 • LAMENTAÇÕES 1-2',
        description: 'Cântico 28: Quem pode ser amigo de Jeová?',
        assignee: 'Cântico 92: Um lugar que leva teu nome',
      },
      {
        section: 'TESOUROS DA PALAVRA DE DEUS',
        title: '1. Uma reação compreensível diante de uma terrível perda (10 min)',
        assignee: 'Valderimar C. Monteiro',
      },
      {
        section: 'TESOUROS DA PALAVRA DE DEUS',
        title: '2. Joias espirituais (10 min)',
        assignee: 'Djonata Bertolini',
      },
      {
        section: 'TESOUROS DA PALAVRA DE DEUS',
        title: '3. Leitura da Bíblia (4 min) Lam. 1:8-18 (th lição 10)',
        assignee: 'James',
      },
      {
        section: 'FAÇA SEU MELHOR NO MINISTÉRIO',
        title: '4. Iniciando conversas (3 min)',
        description: 'TESTEMUNHO INFORMAL. Comece uma conversa amigável com uma pessoa. A conversa termina antes de você conseguir dar testemunho. (lmd lição 2 ponto 4)',
        assignee: 'Camila Medeiros',
        assistant: 'Vangela S. dos Santos',
      },
      {
        section: 'FAÇA SEU MELHOR NO MINISTÉRIO',
        title: '5. Cultivando o interesse (4 min)',
        description: 'TESTEMUNHO PÚBLICO. Use um vídeo do Kit de Ensino e ofereça um estudo bíblico. (lmd lição 9 ponto 4)',
        assignee: 'Camila Medeiros',
        assistant: 'Léia',
      },
      {
        section: 'FAÇA SEU MELHOR NO MINISTÉRIO',
        title: '6. O que você diria? (5 min) Consideração.',
        description: 'DE CASA EM CASA. Faça um resumo da lmd lição 1 ponto 4b. Mostre a imagem. Depois, pergunte',
        assignee: 'Taylisson Mesquita',
      },
      {
        section: 'NOSSA VIDA CRISTÃ',
        title: 'Cântico 90: “Encorajando uns aos outros”',
        assignee: '',
      },
      {
        section: 'NOSSA VIDA CRISTÃ',
        title: '7. Não se esqueça de nossos irmãos e irmãs inativos (15 min) Consideração.',
        assignee: 'Aquiles A. de Oliveira',
      },
      {
        section: 'NOSSA VIDA CRISTÃ',
        title: '8. Estudo bíblico de congregação (30 min)',
        description: 'wcg cap. 17',
        assignee: 'Wdeyverson M. de Freitas',
        assistant: 'Reginaldo',
      },
      {
        section: 'ÁUDIO/VÍDEO & INDICADORES',
        title: 'Áudio',
        assignee: 'Anselmo',
        assistant: 'Áudio e Vídeo',
      },
      {
        section: 'ÁUDIO/VÍDEO & INDICADORES',
        title: 'Microfone Volante',
        assignee: 'James',
        assistant: 'Palco e Microfone',
        description: 'Gabriel S. Aguiar|Microfone',
      },
      {
        section: 'ÁUDIO/VÍDEO & INDICADORES',
        title: 'Indicador',
        assignee: 'Jesuino',
        assistant: 'Interno',
        description: 'Edgard|Externo',
      },
    ]),
  },
  {
    id: 'preset-23-29-nov',
    weekLabel: '23–29 de nov. de 2026',
    chairman: 'Wdeyverson M. de Freitas',
    openingPrayer: 'Wdeyverson M. de Freitas',
    closingPrayer: 'Manoel',
    partsJson: JSON.stringify([
      {
        section: 'Cabecalho',
        title: 'quarta-feira, 25 de novembro de 2026 • LAMENTAÇÕES 3-5',
        description: 'Cântico 158: ‘Não vai se atrasar!’',
        assignee: 'Cântico 74: A canção do Reino',
      },
      {
        section: 'TESOUROS DA PALAVRA DE DEUS',
        title: '1. Não desista quando passar por provações (10 min)',
        assignee: 'Anselmo',
      },
      {
        section: 'TESOUROS DA PALAVRA DE DEUS',
        title: '2. Joias espirituais (10 min)',
        assignee: 'Aquiles A. de Oliveira',
      },
      {
        section: 'TESOUROS DA PALAVRA DE DEUS',
        title: '3. Leitura da Bíblia (4 min) Lam. 3:19-42 (th lição 12)',
        assignee: 'Júlio César',
      },
      {
        section: 'FAÇA SEU MELHOR NO MINISTÉRIO',
        title: '4. Iniciando conversas (3 min)',
        description: 'DE CASA EM CASA. Fale sobre uma verdade da Bíblia. Talvez você possa usar uma das que estão no apêndice A da brochura Ame as Pessoas. (lmd lição 5 ponto 4)',
        assignee: 'Rose Peres',
        assistant: 'Marta Silva',
      },
      {
        section: 'FAÇA SEU MELHOR NO MINISTÉRIO',
        title: '5. Iniciando conversas (4 min)',
        description: 'TESTEMUNHO INFORMAL. Ofereça um folheto. (lmd lição 4 ponto 3)',
        assignee: 'Leila',
        assistant: 'Izaltina G. Coelho',
      },
      {
        section: 'FAÇA SEU MELHOR NO MINISTÉRIO',
        title: '6. Discurso (5 min)',
        description: 'w25.12 26-30 — Tema: Idosos — vocês são uma joia para a congregação. (th lição 16)',
        assignee: 'Sandro',
      },
      {
        section: 'NOSSA VIDA CRISTÃ',
        title: 'Cântico 109: Mostre amor de coração',
        assignee: '',
      },
      {
        section: 'NOSSA VIDA CRISTÃ',
        title: '7. Ajude os cuidadores a não desanimar (15 min) Consideração.',
        assignee: 'Valderimar C. Monteiro',
      },
      {
        section: 'NOSSA VIDA CRISTÃ',
        title: '8. Estudo bíblico de congregação (30 min)',
        description: 'wcg cap. 18',
        assignee: 'Djonata Bertolini',
        assistant: 'Taylisson Mesquita',
      },
      {
        section: 'ÁUDIO/VÍDEO & INDICADORES',
        title: 'Áudio',
        assignee: 'Anselmo',
        assistant: 'Áudio e Vídeo',
      },
      {
        section: 'ÁUDIO/VÍDEO & INDICADORES',
        title: 'Microfone Volante',
        assignee: 'James',
        assistant: 'Palco e Microfone',
        description: 'Gabriel S. Aguiar|Microfone',
      },
      {
        section: 'ÁUDIO/VÍDEO & INDICADORES',
        title: 'Indicador',
        assignee: 'Jesuino',
        assistant: 'Interno',
        description: 'Edgard|Externo',
      },
    ]),
  },
  {
    id: 'preset-30-nov-6-dez',
    weekLabel: '30 de nov.–6 de dez. de 2026',
    chairman: 'Djonata Bertolini',
    openingPrayer: 'Anselmo',
    closingPrayer: 'Aquiles A. de Oliveira',
    partsJson: JSON.stringify([
      {
        section: 'Cabecalho',
        title: 'quarta-feira, 2 de dezembro de 2026 • EZEQUIEL 1-3',
        description: 'Cântico 40: A quem pertence este lugar?',
        assignee: 'Cântico 99: Milhares de irmãos',
      },
      {
        section: 'TESOUROS DA PALAVRA DE DEUS',
        title: '1. O carro celestial de Jeová em movimento (10 min)',
        assignee: 'Aquiles A. de Oliveira',
      },
      {
        section: 'TESOUROS DA PALAVRA DE DEUS',
        title: '2. Joias espirituais (10 min)',
        assignee: 'Wdeyverson M. de Freitas',
      },
      {
        section: 'TESOUROS DA PALAVRA DE DEUS',
        title: '3. Leitura da Bíblia (4 min) Eze. 1:1-14 (th lição 5)',
        assignee: 'Gabriel S. Aguiar',
      },
      {
        section: 'FAÇA SEU MELHOR NO MINISTÉRIO',
        title: '4. Iniciando conversas (3 min)',
        description: 'DE CASA EM CASA. Use uma pergunta para despertar interesse. (lmd lição 1 ponto 3)',
        assignee: 'Camila Medeiros',
        assistant: 'Léia',
      },
      {
        section: 'FAÇA SEU MELHOR NO MINISTÉRIO',
        title: '5. Cultivando o interesse (4 min)',
        description: 'DE CASA EM CASA. Responda a uma pergunta feita na visita anterior. (lmd lição 8 ponto 3)',
        assignee: 'Rose Peres',
        assistant: 'Marta Silva',
      },
      {
        section: 'FAÇA SEU MELHOR NO MINISTÉRIO',
        title: '6. Fazendo discípulos (5 min)',
        description: 'Incentive o estudante a ler a Bíblia diariamente. (th lição 10)',
        assignee: 'Taylisson Mesquita',
        assistant: 'Júlio César',
      },
      {
        section: 'NOSSA VIDA CRISTÃ',
        title: 'Cântico 67: “Prega a palavra”',
        assignee: '',
      },
      {
        section: 'NOSSA VIDA CRISTÃ',
        title: '7. Acompanhe o carro de Jeová (15 min) Consideração.',
        assignee: 'Djonata Bertolini',
      },
      {
        section: 'NOSSA VIDA CRISTÃ',
        title: '8. Estudo bíblico de congregação (30 min)',
        description: 'wcg cap. 19',
        assignee: 'Valderimar C. Monteiro',
        assistant: 'James',
      },
      {
        section: 'ÁUDIO/VÍDEO & INDICADORES',
        title: 'Áudio',
        assignee: 'Wdeyverson M. de Freitas',
        assistant: 'Áudio e Vídeo',
      },
      {
        section: 'ÁUDIO/VÍDEO & INDICADORES',
        title: 'Microfone Volante',
        assignee: 'Reginaldo',
        assistant: 'Palco e Microfone',
        description: 'Sandro|Microfone',
      },
      {
        section: 'ÁUDIO/VÍDEO & INDICADORES',
        title: 'Indicador',
        assignee: 'Manoel',
        assistant: 'Interno',
        description: 'Jesuino|Externo',
      },
    ]),
  },
  {
    id: 'preset-7-13-dez',
    weekLabel: '7–13 de dez. de 2026',
    chairman: 'Valderimar C. Monteiro',
    openingPrayer: 'Taylisson Mesquita',
    closingPrayer: 'Djonata Bertolini',
    partsJson: JSON.stringify([
      {
        section: 'Cabecalho',
        title: 'quarta-feira, 9 de dezembro de 2026 • EZEQUIEL 4-7',
        description: 'Cântico 45: A meditação do meu coração',
        assignee: 'Cântico 126: Não desista, continue forte!',
      },
      {
        section: 'TESOUROS DA PALAVRA DE DEUS',
        title: '1. O fim chegou para os adoradores de ídolos (10 min)',
        assignee: 'Wdeyverson M. de Freitas',
      },
      {
        section: 'TESOUROS DA PALAVRA DE DEUS',
        title: '2. Joias espirituais (10 min)',
        assignee: 'Anselmo',
      },
      {
        section: 'TESOUROS DA PALAVRA DE DEUS',
        title: '3. Leitura da Bíblia (4 min) Eze. 7:1-15 (th lição 11)',
        assignee: 'Edgard',
      },
      {
        section: 'FAÇA SEU MELHOR NO MINISTÉRIO',
        title: '4. Iniciando conversas (3 min)',
        description: 'TESTEMUNHO INFORMAL. Elogie a pessoa e inicie uma conversa. (lmd lição 2 ponto 5)',
        assignee: 'Leila',
        assistant: 'Izaltina G. Coelho',
      },
      {
        section: 'FAÇA SEU MELHOR NO MINISTÉRIO',
        title: '5. Cultivando o interesse (4 min)',
        description: 'DE CASA EM CASA. Deixe uma publicação do Kit de Ensino. (lmd lição 7 ponto 5)',
        assignee: 'Vangela S. dos Santos',
        assistant: 'Camila Medeiros',
      },
      {
        section: 'FAÇA SEU MELHOR NO MINISTÉRIO',
        title: '6. Discurso (5 min)',
        description: 'Tema: Por que o dinheiro não poderá salvar ninguém no dia da fúria de Jeová? (th lição 13)',
        assignee: 'Reginaldo',
      },
      {
        section: 'NOSSA VIDA CRISTÃ',
        title: 'Cântico 58: Procure os amigos da paz',
        assignee: '',
      },
      {
        section: 'NOSSA VIDA CRISTÃ',
        title: '7. Realizações da Organização (15 min) Vídeo e consideração.',
        assignee: 'Taylisson Mesquita',
      },
      {
        section: 'NOSSA VIDA CRISTÃ',
        title: '8. Estudo bíblico de congregação (30 min)',
        description: 'wcg cap. 20',
        assignee: 'Aquiles A. de Oliveira',
        assistant: 'Júlio César',
      },
      {
        section: 'ÁUDIO/VÍDEO & INDICADORES',
        title: 'Áudio',
        assignee: 'Anselmo',
        assistant: 'Áudio e Vídeo',
      },
      {
        section: 'ÁUDIO/VÍDEO & INDICADORES',
        title: 'Microfone Volante',
        assignee: 'James',
        assistant: 'Palco e Microfone',
        description: 'Gabriel S. Aguiar|Microfone',
      },
      {
        section: 'ÁUDIO/VÍDEO & INDICADORES',
        title: 'Indicador',
        assignee: 'Jesuino',
        assistant: 'Interno',
        description: 'Edgard|Externo',
      },
    ]),
  },
  {
    id: 'preset-14-20-dez',
    weekLabel: '14–20 de dez. de 2026',
    chairman: 'Taylisson Mesquita',
    openingPrayer: 'Wdeyverson M. de Freitas',
    closingPrayer: 'Anselmo',
    partsJson: JSON.stringify([
      {
        section: 'Cabecalho',
        title: 'quarta-feira, 16 de dezembro de 2026 • EZEQUIEL 8-11',
        description: 'Cântico 50: Minha oração de dedicação',
        assignee: 'Cântico 134: Os filhos são uma herança de Deus',
      },
      {
        section: 'TESOUROS DA PALAVRA DE DEUS',
        title: '1. Você está marcado para sobreviver? (10 min)',
        assignee: 'Djonata Bertolini',
      },
      {
        section: 'TESOUROS DA PALAVRA DE DEUS',
        title: '2. Joias espirituais (10 min)',
        assignee: 'Valderimar C. Monteiro',
      },
      {
        section: 'TESOUROS DA PALAVRA DE DEUS',
        title: '3. Leitura da Bíblia (4 min) Eze. 9:1-11 (th lição 2)',
        assignee: 'Manoel',
      },
      {
        section: 'FAÇA SEU MELHOR NO MINISTÉRIO',
        title: '4. Iniciando conversas (3 min)',
        description: 'DE CASA EM CASA. Mostre empatia ao morador. (lmd lição 3 ponto 3)',
        assignee: 'Rose Peres',
        assistant: 'Marta Silva',
      },
      {
        section: 'FAÇA SEU MELHOR NO MINISTÉRIO',
        title: '5. Cultivando o interesse (4 min)',
        description: 'TESTEMUNHO PÚBLICO. Convide a pessoa para a reunião. (lmd lição 9 ponto 5)',
        assignee: 'Camila Medeiros',
        assistant: 'Léia',
      },
      {
        section: 'FAÇA SEU MELHOR NO MINISTÉRIO',
        title: '6. Fazendo discípulos (5 min)',
        description: 'Ajude o estudante a vencer um hábito ruim. (th lição 15)',
        assignee: 'Sandro',
        assistant: 'James',
      },
      {
        section: 'NOSSA VIDA CRISTÃ',
        title: 'Cântico 89: Escute, obedeça e seja abençoado',
        assignee: '',
      },
      {
        section: 'NOSSA VIDA CRISTÃ',
        title: '7. Necessidades locais (15 min) Consideração.',
        assignee: 'Aquiles A. de Oliveira',
      },
      {
        section: 'NOSSA VIDA CRISTÃ',
        title: '8. Estudo bíblico de congregação (30 min)',
        description: 'wcg cap. 21',
        assignee: 'Wdeyverson M. de Freitas',
        assistant: 'Taylisson Mesquita',
      },
      {
        section: 'ÁUDIO/VÍDEO & INDICADORES',
        title: 'Áudio',
        assignee: 'Djonata Bertolini',
        assistant: 'Áudio e Vídeo',
      },
      {
        section: 'ÁUDIO/VÍDEO & INDICADORES',
        title: 'Microfone Volante',
        assignee: 'Júlio César',
        assistant: 'Palco e Microfone',
        description: 'Reginaldo|Microfone',
      },
      {
        section: 'ÁUDIO/VÍDEO & INDICADORES',
        title: 'Indicador',
        assignee: 'Sandro',
        assistant: 'Interno',
        description: 'Manoel|Externo',
      },
    ]),
  },
  {
    id: 'preset-21-27-dez',
    weekLabel: '21–27 de dez. de 2026',
    chairman: 'Wdeyverson M. de Freitas',
    openingPrayer: 'Aquiles A. de Oliveira',
    closingPrayer: 'Taylisson Mesquita',
    partsJson: JSON.stringify([
      {
        section: 'Cabecalho',
        title: 'quarta-feira, 23 de dezembro de 2026 • EZEQUIEL 12-14',
        description: 'Cântico 55: Não tenha medo deles!',
        assignee: 'Cântico 150: Busquem a Deus para serem salvos',
      },
      {
        section: 'TESOUROS DA PALAVRA DE DEUS',
        title: '1. Cada um será salvo pela sua própria justiça (10 min)',
        assignee: 'Aquiles A. de Oliveira',
      },
      {
        section: 'TESOUROS DA PALAVRA DE DEUS',
        title: '2. Joias espirituais (10 min)',
        assignee: 'Taylisson Mesquita',
      },
      {
        section: 'TESOUROS DA PALAVRA DE DEUS',
        title: '3. Leitura da Bíblia (4 min) Eze. 14:12-23 (th lição 10)',
        assignee: 'Reginaldo',
      },
      {
        section: 'FAÇA SEU MELHOR NO MINISTÉRIO',
        title: '4. Iniciando conversas (3 min)',
        description: 'DE CASA EM CASA. Use um folheto para iniciar a conversa. (lmd lição 4 ponto 4)',
        assignee: 'Leila',
        assistant: 'Izaltina G. Coelho',
      },
      {
        section: 'FAÇA SEU MELHOR NO MINISTÉRIO',
        title: '5. Cultivando o interesse (4 min)',
        description: 'TESTEMUNHO INFORMAL. Apresente o curso bíblico interativo. (lmd lição 8 ponto 4)',
        assignee: 'Camila Medeiros',
        assistant: 'Vangela S. dos Santos',
      },
      {
        section: 'FAÇA SEU MELHOR NO MINISTÉRIO',
        title: '6. Discurso (5 min)',
        description: 'Tema: Imite a fé de Noé, Daniel e Jó. (th lição 12)',
        assignee: 'Anselmo',
      },
      {
        section: 'NOSSA VIDA CRISTÃ',
        title: 'Cântico 118: “Dá-nos mais fé”',
        assignee: '',
      },
      {
        section: 'NOSSA VIDA CRISTÃ',
        title: '7. Fortaleça sua fé nas promessas de Jeová (15 min) Consideração.',
        assignee: 'Valderimar C. Monteiro',
      },
      {
        section: 'NOSSA VIDA CRISTÃ',
        title: '8. Estudo bíblico de congregação (30 min)',
        description: 'wcg cap. 22',
        assignee: 'Djonata Bertolini',
        assistant: 'Gabriel S. Aguiar',
      },
      {
        section: 'ÁUDIO/VÍDEO & INDICADORES',
        title: 'Áudio',
        assignee: 'Anselmo',
        assistant: 'Áudio e Vídeo',
      },
      {
        section: 'ÁUDIO/VÍDEO & INDICADORES',
        title: 'Microfone Volante',
        assignee: 'James',
        assistant: 'Palco e Microfone',
        description: 'Gabriel S. Aguiar|Microfone',
      },
      {
        section: 'ÁUDIO/VÍDEO & INDICADORES',
        title: 'Indicador',
        assignee: 'Jesuino',
        assistant: 'Interno',
        description: 'Edgard|Externo',
      },
    ]),
  },
];

const HORAS_BASE_POR_DIA: Record<number, number> = {
  2: 2,
  5: 4.0,
  9: 3.0,
  12: 4.5,
  16: 3.0,
};

function normalizeWeekKey(label: string): string {
  const nums = label.match(/\d+/g);
  if (nums && nums.length >= 2) {
    return `${nums[0]}-${nums[1]}`;
  }
  return label.trim().toLowerCase();
}

function formatWeekTwoLines(label: string): { top: string; bottom?: string } {
  const idx = label.indexOf(' de 202');
  if (idx > 0) {
    return {
      top: label.slice(0, idx).trim(),
      bottom: label.slice(idx).trim(),
    };
  }
  return { top: label };
}

function isElderOrDev(user: MemberProfile | null) {
  if (!user) return false;
  return user.role === 'ANCIAO' || user.role === 'DESENVOLVEDOR' || user.role === 'ADMIN';
}

function isPioneer(user: MemberProfile | null) {
  if (!user) return false;
  return (
    user.role === 'PIONEIRO_REGULAR' ||
    user.role === 'PIONEIRO_AUXILIAR' ||
    (user.monthlyGoal || 0) > 0
  );
}

function canMemberUseTimer(user: MemberProfile | null) {
  if (!user || !isPioneer(user)) return false;
  return isElderOrDev(user) || user.canUseTimer === true;
}

function parseParts(partsJson: string): MidweekPart[] {
  try {
    const parsed = JSON.parse(partsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function lerCronometroDoUtilizador(userId: string) {
  const savedTimer = localStorage.getItem(`@horto:timer_${userId}`);
  if (savedTimer) {
    try {
      const { running, startTimestamp, accumulated } = JSON.parse(savedTimer);
      if (running && startTimestamp) {
        const now = Math.floor(Date.now() / 1000);
        return { running: true, seconds: accumulated + (now - startTimestamp) };
      }
      return { running: false, seconds: accumulated || 0 };
    } catch {
      return { running: false, seconds: 0 };
    }
  }
  return { running: false, seconds: 0 };
}

function TerritoryMap({
  territorios,
  focoCoords,
  onSelectTerritory,
}: {
  territorios: TerritoryItem[];
  focoCoords: [number, number] | null;
  onSelectTerritory: (id: string) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-9.9508, -67.8248],
      zoom: 15,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    layersRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layersRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    territorios.forEach((t) => {
      const isDisponivel = t.status === 'Disponível';
      const cor = isDisponivel ? '#22c55e' : '#eab308';

      const deltaLat = 0.0014;
      const deltaLng = 0.0018;
      const bounds: L.LatLngTuple[] = [
        [t.lat - deltaLat, t.lat ? t.lng - deltaLng : -67.825],
        [t.lat + deltaLat, t.lng - deltaLng],
        [t.lat + deltaLat, t.lng + deltaLng],
        [t.lat - deltaLat, t.lng + deltaLng],
      ];

      const polygon = L.polygon(bounds, {
        color: cor,
        weight: 2,
        fillColor: cor,
        fillOpacity: 0.28,
      }).addTo(layerGroup);

      const badgeIcon = L.divIcon({
        className: 'custom-territory-pin',
        html: `<div style="
          background: ${isDisponivel ? '#15803d' : '#a16207'};
          color: #ffffff;
          font-weight: 800;
          font-size: 11px;
          padding: 3px 7px;
          border-radius: 9999px;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.45);
          white-space: nowrap;
          text-align: center;
        ">${t.id}</div>`,
        iconSize: [44, 24],
        iconAnchor: [22, 12],
      });

      const marker = L.marker([t.lat, t.lng], { icon: badgeIcon }).addTo(layerGroup);

      const popupContent = `
        <div style="font-family: sans-serif; min-width: 170px;">
          <strong style="font-size: 13px; color: #121A13;">${t.id} • ${t.nome}</strong>
          <p style="margin: 4px 0; font-size: 11px; color: #374151;">
            Status: <b>${t.status}</b><br/>
            Responsável: <b>${t.responsavel}</b><br/>
            Total: <b>${t.quadras} quadras</b>
          </p>
        </div>
      `;

      polygon.bindPopup(popupContent);
      marker.bindPopup(popupContent);

      polygon.on('click', () => onSelectTerritory(t.id));
      marker.on('click', () => onSelectTerritory(t.id));
    });
  }, [territorios, onSelectTerritory]);

  useEffect(() => {
    if (mapInstanceRef.current && focoCoords) {
      mapInstanceRef.current.flyTo(focoCoords, 16, { duration: 0.8 });
    }
  }, [focoCoords]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#2F4231] shadow-lg">
      <div ref={mapContainerRef} className="w-full h-64 z-0" />
      <div className="bg-[#152017] px-3 py-2 flex justify-between items-center text-[11px] border-t border-[#2F4231]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Disponível
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block"></span> Em andamento
          </span>
        </div>
        <span className="text-[#8FA38B] font-semibold">Toque na quadra para detalhes</span>
      </div>
    </div>
  );
}

export default function App() {
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<MemberProfile | null>(null);
  const [territorios, setTerritorios] = useState<TerritoryItem[]>([]);
  const [escalas, setEscalas] = useState<AssignmentItem[]>([]);
  const [midweekMeetings, setMidweekMeetings] = useState<MidweekMeetingItem[]>([]);
  const [cleaningSchedules, setCleaningSchedules] = useState<CleaningScheduleItem[]>([]);

  const [activeTab, setActiveTab] = useState<Tab>('inicio');
  const [scheduleSubTab, setScheduleSubTab] = useState<ScheduleSubTab>('meio_de_semana');
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(2);
  const [showWeekModal, setShowWeekModal] = useState<boolean>(false);
  const [switchingWeek, setSwitchingWeek] = useState<boolean>(false);

  const [darkMode, setDarkMode] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loadingDb, setLoadingDb] = useState(true);

  const [focoMapa, setFocoMapa] = useState<[number, number] | null>(null);
  const [territorioDestacado, setTerritorioDestacado] = useState<string | null>(null);

  const [showNewMemberForm, setShowNewMemberForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('PUBLICADOR');
  const [newGoal, setNewGoal] = useState(0);
  const [newGroup, setNewGroup] = useState('Grupo 1 - Horto');

  const [memberToDeleteId, setMemberToDeleteId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingMember, setDeletingMember] = useState(false);

  const [participouPregacaoPorMembro, setParticipouPregacaoPorMembro] = useState<
    Record<string, boolean>
  >(() => {
    try {
      return JSON.parse(localStorage.getItem('@horto:participou_pregacao') || '{}');
    } catch {
      return {};
    }
  });

  const [myServiceUnlockedIds, setMyServiceUnlockedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('@horto:my_service_unlocked_ids') || '[]');
    } catch {
      return [];
    }
  });
  const [diaSelecionadoCalendario, setDiaSelecionadoCalendario] = useState<number>(2);

  const [horasAjustadasPorMembro, setHorasAjustadasPorMembro] = useState<
    Record<string, Record<number, number>>
  >(() => {
    try {
      return JSON.parse(localStorage.getItem('@horto:calendar_day_overrides') || '{}');
    } catch {
      return {};
    }
  });
  const [horasDiaInput, setHorasDiaInput] = useState('');

  const [showNewAssignmentForm, setShowNewAssignmentForm] = useState(false);
  const [novoCargo, setNovoCargo] = useState('');
  const [novoTemaDiscurso, setNovoTemaDiscurso] = useState('');
  const [novaDataEscala, setNovaDataEscala] = useState('');
  const [novoLocalEscala, setNovoLocalEscala] = useState('Salão Principal');
  const [membroDesignadoId, setMembroDesignadoId] = useState('');

  const [showNewMidweekForm, setShowNewMidweekForm] = useState(false);
  const [editingMidweekId, setEditingMidweekId] = useState<string | null>(null);
  const [mwWeekLabel, setMwWeekLabel] = useState('16–22 de nov. de 2026');
  const [mwMeetingDay, setMwMeetingDay] = useState('quarta-feira, 18 de novembro de 2026');
  const [mwBibleReading, setMwBibleReading] = useState('LAMENTAÇÕES 1-2');
  const [mwOpeningSong, setMwOpeningSong] = useState('Cântico 28: Quem pode ser amigo de Jeová?');
  const [mwClosingSong, setMwClosingSong] = useState('Cântico 74: A canção do Reino');
  const [mwChairman, setMwChairman] = useState('');
  const [mwOpeningPrayer, setMwOpeningPrayer] = useState('');
  const [mwClosingPrayer, setMwClosingPrayer] = useState('');

  const [mwTreasures1, setMwTreasures1] = useState('1. Uma reação compreensível diante de uma terrível perda (10 min)');
  const [mwTreasures1Assignee, setMwTreasures1Assignee] = useState('');
  const [mwTreasures2, setMwTreasures2] = useState('2. Joias espirituais (10 min)');
  const [mwTreasures2Assignee, setMwTreasures2Assignee] = useState('');
  const [mwTreasures3, setMwTreasures3] = useState('3. Leitura da Bíblia (4 min) Lam. 1:8-18 (th lição 10)');
  const [mwTreasures3Assignee, setMwTreasures3Assignee] = useState('');

  const [mwMinistry4, setMwMinistry4] = useState('4. Iniciando conversas (3 min)');
  const [mwMinistry4Desc, setMwMinistry4Desc] = useState('TESTEMUNHO INFORMAL. Comece uma conversa amigável com uma pessoa...');
  const [mwMinistry4Assignee, setMwMinistry4Assignee] = useState('');
  const [mwMinistry4Assistant, setMwMinistry4Assistant] = useState('');

  const [mwMinistry5, setMwMinistry5] = useState('5. Cultivando o interesse (4 min)');
  const [mwMinistry5Desc, setMwMinistry5Desc] = useState('TESTEMUNHO PÚBLICO. Use um vídeo do Kit de Ensino e ofereça um estudo bíblico.');
  const [mwMinistry5Assignee, setMwMinistry5Assignee] = useState('');
  const [mwMinistry5Assistant, setMwMinistry5Assistant] = useState('');

  const [mwMinistry6, setMwMinistry6] = useState('6. O que você diria? (5 min) Consideração.');
  const [mwMinistry6Desc, setMwMinistry6Desc] = useState('DE CASA EM CASA. Faça um resumo da lmd lição 1 ponto 4b. Mostre a imagem. Depois, pergunte');
  const [mwMinistry6Assignee, setMwMinistry6Assignee] = useState('');
  const [mwMinistry6Assistant, setMwMinistry6Assistant] = useState('');

  const [mwLivingSong, setMwLivingSong] = useState('Cântico 90: “Encorajando uns aos outros”');
  const [mwLiving7, setMwLiving7] = useState('7. Não se esqueça de nossos irmãos e irmãs inativos (15 min) Consideração.');
  const [mwLiving7Assignee, setMwLiving7Assignee] = useState('');
  const [mwLiving8, setMwLiving8] = useState('8. Estudo bíblico de congregação (30 min)');
  const [mwLiving8Desc, setMwLiving8Desc] = useState('wcg cap. 17');
  const [mwLiving8Assignee, setMwLiving8Assignee] = useState('');
  const [mwLiving8Assistant, setMwLiving8Assistant] = useState('');

  const [mwAudioName, setMwAudioName] = useState('Anselmo');
  const [mwAudioRole, setMwAudioRole] = useState('Áudio e Vídeo');
  const [mwMic1Name, setMwMic1Name] = useState('James');
  const [mwMic1Role, setMwMic1Role] = useState('Palco e Microfone');
  const [mwMic2Name, setMwMic2Name] = useState('Gabriel S. Aguiar');
  const [mwMic2Role, setMwMic2Role] = useState('Microfone');
  const [mwInd1Name, setMwInd1Name] = useState('Jesuino');
  const [mwInd1Role, setMwInd1Role] = useState('Interno');
  const [mwInd2Name, setMwInd2Name] = useState('Edgard');
  const [mwInd2Role, setMwInd2Role] = useState('Externo');

  const [showNewCleaningForm, setShowNewCleaningForm] = useState(false);
  const [cleanWeekLabel, setCleanWeekLabel] = useState('');
  const [cleanGroupName, setCleanGroupName] = useState('Grupo 1 - Horto');
  const [cleanNotes, setCleanNotes] = useState('');

  const [observacoesRelatorio, setObservacoesRelatorio] = useState('');

  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [revisitas, setRevisitas] = useState(2);
  const [estudos, setEstudos] = useState(1);

  const [sessions, setSessions] = useState<TimeSession[]>(() => {
    return JSON.parse(localStorage.getItem('@horto:offline_queue') || '[]');
  });

  const aplicarUtilizador = useCallback((u: MemberProfile | null) => {
    setCurrentUser(u);
    setMemberToDeleteId(null);
    setDeletePassword('');
    setHorasDiaInput('');
    if (u) {
      localStorage.setItem('@horto:current_user_id', u.id);
      if (!canMemberUseTimer(u)) {
        setIsRunning(false);
        setElapsedSeconds(0);
        return;
      }
      const estado = lerCronometroDoUtilizador(u.id);
      setIsRunning(estado.running);
      setElapsedSeconds(estado.seconds);
    } else {
      setIsRunning(false);
      setElapsedSeconds(0);
    }
  }, []);

  const carregarDadosDoBanco = useCallback(async () => {
    try {
      const [resMembers, resTerritories, resAssignments, resMidweek, resCleaning] = await Promise.all([
        fetch(`${API_URL}/members`),
        fetch(`${API_URL}/territories`),
        fetch(`${API_URL}/assignments`),
        fetch(`${API_URL}/midweek-meetings`),
        fetch(`${API_URL}/cleaning-schedules`),
      ]);

      if (resMembers.ok && resTerritories.ok && resAssignments.ok) {
        const listaMembros: MemberProfile[] = await resMembers.json();
        const listaTerritorios: TerritoryItem[] = await resTerritories.json();
        const listaEscalas: AssignmentItem[] = await resAssignments.json();

        setMembers(listaMembros);
        setTerritorios(listaTerritorios);
        setEscalas(listaEscalas);

        if (resMidweek.ok) {
          setMidweekMeetings(await resMidweek.json());
        }
        if (resCleaning.ok) {
          setCleaningSchedules(await resCleaning.json());
        }

        if (listaMembros.length > 0 && !membroDesignadoId) {
          setMembroDesignadoId(listaMembros[0].id);
        }

        const savedUserId = localStorage.getItem('@horto:current_user_id');
        const encontrado =
          listaMembros.find((m) => m.id === savedUserId) ||
          listaMembros.find((m) => m.name === 'Taylyson') ||
          listaMembros[0];

        if (encontrado) {
          aplicarUtilizador(encontrado);
        }
      }
    } catch (err) {
      console.warn('Modo Offline: a usar cache local.', err);
    } finally {
      setLoadingDb(false);
    }
  }, [aplicarUtilizador, membroDesignadoId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarDadosDoBanco();
    }, 0);
    return () => clearTimeout(timer);
  }, [carregarDadosDoBanco]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      carregarDadosDoBanco();
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [carregarDadosDoBanco]);

  const ehPioneiro = isPioneer(currentUser);
  const participouPregacao = currentUser
    ? Boolean(participouPregacaoPorMembro[currentUser.id])
    : false;
  const podeAtivarCronometro = canMemberUseTimer(currentUser);
  const podeVerTodasHoras = Boolean(currentUser && (currentUser.canViewAllHours || isElderOrDev(currentUser)));
  const podeEnviarDesignacoes = Boolean(currentUser && (currentUser.canAssignParts || isElderOrDev(currentUser)));
  const podeGerirPermissoes = isElderOrDev(currentUser);
  const podeVerMyService = Boolean(
    ehPioneiro && currentUser && (isElderOrDev(currentUser) || myServiceUnlockedIds.includes(currentUser.id))
  );

  const alternarParticipacaoPregacao = (valor: boolean) => {
    if (!currentUser) return;
    setParticipouPregacaoPorMembro((prev) => {
      const atualizado = { ...prev, [currentUser.id]: valor };
      localStorage.setItem('@horto:participou_pregacao', JSON.stringify(atualizado));
      return atualizado;
    });
  };

  const alternarMyServiceMembro = (memberId: string) => {
    if (!podeGerirPermissoes) return;
    setMyServiceUnlockedIds((prev) => {
      const exists = prev.includes(memberId);
      const updated = exists ? prev.filter((id) => id !== memberId) : [...prev, memberId];
      localStorage.setItem('@horto:my_service_unlocked_ids', JSON.stringify(updated));
      return updated;
    });
  };

  const salvarHorasDoDiaNoCalendario = (dia: number, novoValorHoras: number) => {
    if (!currentUser) return;
    const valorLimpo = Math.max(0, +novoValorHoras.toFixed(2));
    setHorasAjustadasPorMembro((prev) => {
      const atualMembro = prev[currentUser.id] || {};
      const atualizado = {
        ...prev,
        [currentUser.id]: {
          ...atualMembro,
          [dia]: valorLimpo,
        },
      };
      localStorage.setItem('@horto:calendar_day_overrides', JSON.stringify(atualizado));
      return atualizado;
    });
  };

  const aplicarHorasDigitadasNoDia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !podeVerMyService) return;
    const parsed = Number(horasDiaInput.replace(',', '.'));
    if (Number.isNaN(parsed) || parsed < 0) {
      alert('Digite um número válido (ex: 1 ou 1.5).');
      return;
    }
    salvarHorasDoDiaNoCalendario(diaSelecionadoCalendario, parsed);
    setHorasDiaInput('');
  };

  const removerHorasDoDiaNoCalendario = (dia: number) => {
    salvarHorasDoDiaNoCalendario(dia, 0);
  };

  useEffect(() => {
    if (!currentUser || !podeAtivarCronometro) return;
    const storageKey = `@horto:timer_${currentUser.id}`;
    let interval: ReturnType<typeof setInterval>;

    if (isRunning) {
      const startTimestamp = Math.floor(Date.now() / 1000) - elapsedSeconds;
      localStorage.setItem(
        storageKey,
        JSON.stringify({ running: true, startTimestamp, accumulated: elapsedSeconds })
      );
      interval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        setElapsedSeconds(now - startTimestamp);
      }, 1000);
    } else {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ running: false, startTimestamp: null, accumulated: elapsedSeconds })
      );
    }
    return () => clearInterval(interval);
  }, [isRunning, elapsedSeconds, currentUser, podeAtivarCronometro]);

  const formatTime = (totalSeconds: number) => {
    const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSeconds % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const alternarCronometro = () => {
    if (!podeAtivarCronometro) {
      alert('🔒 O cronômetro está bloqueado para este perfil. Peça liberação a um Ancião ou Desenvolvedor.');
      return;
    }
    setIsRunning(!isRunning);
  };

  const zerarCronometroAtual = () => {
    if (!currentUser || !podeAtivarCronometro) return;
    setIsRunning(false);
    setElapsedSeconds(0);
    localStorage.removeItem(`@horto:timer_${currentUser.id}`);
  };

  const removerSessaoGravada = async (sessionId: string) => {
    try {
      const res = await fetch(`${API_URL}/timelogs/${sessionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.error) {
          alert(`⚠️ ${data.error}`);
          return;
        }
        await carregarDadosDoBanco();
      }
    } catch {
      alert('Erro ao remover sessão do banco.');
    }
  };

  const finalizarSessao = async () => {
    if (!currentUser || !podeAtivarCronometro) {
      alert('🔒 O cronômetro está bloqueado para este perfil.');
      return;
    }
    setIsRunning(false);

    const novoRegistro: TimeSession = {
      id: crypto.randomUUID(),
      memberId: currentUser.id,
      date: new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      durationSec: elapsedSeconds,
      revisitas,
      estudos,
      synced: false,
    };

    const novaFila = [novoRegistro, ...sessions];
    setSessions(novaFila);
    localStorage.setItem('@horto:offline_queue', JSON.stringify(novaFila));
    setElapsedSeconds(0);
    localStorage.removeItem(`@horto:timer_${currentUser.id}`);

    try {
      const res = await fetch(`${API_URL}/timelogs/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: currentUser.id,
          logs: [novoRegistro],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.error) {
          alert(`⚠️ ${data.error}`);
          return;
        }
        const filaAtualizada = novaFila.map((s) =>
          s.id === novoRegistro.id ? { ...s, synced: true } : s
        );
        setSessions(filaAtualizada);
        localStorage.setItem('@horto:offline_queue', JSON.stringify(filaAtualizada));
        await carregarDadosDoBanco();
        alert(`✅ Sessão de ${currentUser.name} gravada no banco PostgreSQL (Neon)!`);
        return;
      }
    } catch {
      // Sem ligação, mantém guardado localmente
    }

    alert(`⚡ Modo Offline: Sessão guardada no aparelho de ${currentUser.name}!`);
  };

  const atualizarTerritorioNoBanco = async (territorioId: string, novoStatus: string, novoResponsavel: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${API_URL}/territories/${territorioId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responsavel: novoResponsavel,
          status: novoStatus,
        }),
      });
      if (res.ok) {
        await carregarDadosDoBanco();
      }
    } catch {
      alert('Sem ligação ao servidor de momento.');
    }
  };

  const confirmarEscalaNoBanco = async (escalaId: string) => {
    try {
      const res = await fetch(`${API_URL}/assignments/${escalaId}/confirm`, {
        method: 'POST',
      });
      if (res.ok) {
        await carregarDadosDoBanco();
      }
    } catch {
      alert('Erro ao confirmar presença na escala.');
    }
  };

  const removerEscalaNoBanco = async (escalaId: string) => {
    if (!podeEnviarDesignacoes) return;
    try {
      const res = await fetch(`${API_URL}/assignments/${escalaId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await carregarDadosDoBanco();
      }
    } catch {
      alert('Erro ao remover designação.');
    }
  };

  const criarNovaEscalaNoBanco = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeEnviarDesignacoes || !novoCargo.trim() || !novaDataEscala.trim() || !membroDesignadoId) return;

    try {
      const res = await fetch(`${API_URL}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cargo: novoCargo,
          theme: novoTemaDiscurso,
          data: novaDataEscala,
          local: novoLocalEscala,
          memberId: membroDesignadoId,
          actorId: currentUser?.id,
        }),
      });

      if (res.ok) {
        setNovoCargo('');
        setNovoTemaDiscurso('');
        setNovaDataEscala('');
        setShowNewAssignmentForm(false);
        await carregarDadosDoBanco();
        alert('📅 Nova designação / parte gravada no PostgreSQL!');
      }
    } catch {
      alert('Erro ao criar nova designação.');
    }
  };

  const abrirEdicaoReuniaoMeioSemana = (reuniao: MidweekMeetingItem) => {
    const partes = parseParts(reuniao.partsJson);
    const cab = partes.find((p) => p.section === 'Cabecalho');
    const tes = partes.filter((p) => p.section === 'TESOUROS DA PALAVRA DE DEUS');
    const min = partes.filter((p) => p.section === 'FAÇA SEU MELHOR NO MINISTÉRIO');
    const vid = partes.filter((p) => p.section === 'NOSSA VIDA CRISTÃ');
    const aud = partes.filter((p) => p.section === 'ÁUDIO/VÍDEO & INDICADORES');

    const tituloCab = cab?.title || '';
    const [diaParte, leituraParte] = tituloCab.includes(' • ')
      ? tituloCab.split(' • ')
      : [tituloCab, ''];

    const cantVida = vid.find((v) => !v.assignee);
    const partesVidaNumeradas = vid.filter((v) => Boolean(v.assignee));

    const itemAudio = aud.find((a) => a.title === 'Áudio') || aud[0];
    const itemMic = aud.find((a) => a.title === 'Microfone Volante') || aud[1];
    const itemInd = aud.find((a) => a.title === 'Indicador') || aud[2];

    const [mic2Nome, mic2Func] = (itemMic?.description || '|').split('|');
    const [ind2Nome, ind2Func] = (itemInd?.description || '|').split('|');

    setEditingMidweekId(reuniao.id.startsWith('preset-') ? null : reuniao.id);
    setMwWeekLabel(reuniao.weekLabel);
    setMwMeetingDay(diaParte || reuniao.weekLabel);
    setMwBibleReading(leituraParte || '');
    setMwOpeningSong(cab?.description || '');
    setMwClosingSong(cab?.assignee || 'Cântico 74: A canção do Reino');
    setMwChairman(reuniao.chairman);
    setMwOpeningPrayer(reuniao.openingPrayer);
    setMwClosingPrayer(reuniao.closingPrayer);

    setMwTreasures1(tes[0]?.title || '1. Tesouros da Palavra de Deus (10 min)');
    setMwTreasures1Assignee(tes[0]?.assignee || '');
    setMwTreasures2(tes[1]?.title || '2. Joias espirituais (10 min)');
    setMwTreasures2Assignee(tes[1]?.assignee || '');
    setMwTreasures3(tes[2]?.title || '3. Leitura da Bíblia (4 min)');
    setMwTreasures3Assignee(tes[2]?.assignee || '');

    setMwMinistry4(min[0]?.title || '4. Iniciando conversas (3 min)');
    setMwMinistry4Desc(min[0]?.description || '');
    setMwMinistry4Assignee(min[0]?.assignee || '');
    setMwMinistry4Assistant(min[0]?.assistant || '');

    setMwMinistry5(min[1]?.title || '5. Cultivando o interesse (4 min)');
    setMwMinistry5Desc(min[1]?.description || '');
    setMwMinistry5Assignee(min[1]?.assignee || '');
    setMwMinistry5Assistant(min[1]?.assistant || '');

    setMwMinistry6(min[2]?.title || '6. Discurso (5 min)');
    setMwMinistry6Desc(min[2]?.description || '');
    setMwMinistry6Assignee(min[2]?.assignee || '');
    setMwMinistry6Assistant(min[2]?.assistant || '');

    setMwLivingSong(cantVida?.title || 'Cântico 109: Mostre amor de coração');
    setMwLiving7(partesVidaNumeradas[0]?.title || '7. Consideração (15 min)');
    setMwLiving7Assignee(partesVidaNumeradas[0]?.assignee || '');
    setMwLiving8(partesVidaNumeradas[1]?.title || '8. Estudo bíblico de congregação (30 min)');
    setMwLiving8Desc(partesVidaNumeradas[1]?.description || '');
    setMwLiving8Assignee(partesVidaNumeradas[1]?.assignee || '');
    setMwLiving8Assistant(partesVidaNumeradas[1]?.assistant || '');

    setMwAudioName(itemAudio?.assignee || 'Anselmo');
    setMwAudioRole(itemAudio?.assistant || 'Áudio e Vídeo');
    setMwMic1Name(itemMic?.assignee || 'James');
    setMwMic1Role(itemMic?.assistant || 'Palco e Microfone');
    setMwMic2Name(mic2Nome || 'Gabriel S. Aguiar');
    setMwMic2Role(mic2Func || 'Microfone');
    setMwInd1Name(itemInd?.assignee || 'Jesuino');
    setMwInd1Role(itemInd?.assistant || 'Interno');
    setMwInd2Name(ind2Nome || 'Edgard');
    setMwInd2Role(ind2Func || 'Externo');

    setShowNewMidweekForm(true);
  };

  const salvarReuniaoMeioSemana = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeEnviarDesignacoes || !mwWeekLabel.trim() || !mwChairman.trim()) return;

    const parts: MidweekPart[] = [
      {
        section: 'Cabecalho',
        title: mwBibleReading.trim()
          ? `${mwMeetingDay.trim()} • ${mwBibleReading.trim()}`
          : mwMeetingDay.trim(),
        description: mwOpeningSong.trim(),
        assignee: mwClosingSong.trim(),
      },
      {
        section: 'TESOUROS DA PALAVRA DE DEUS',
        title: mwTreasures1.trim(),
        assignee: mwTreasures1Assignee.trim() || mwChairman.trim(),
      },
      {
        section: 'TESOUROS DA PALAVRA DE DEUS',
        title: mwTreasures2.trim(),
        assignee: mwTreasures2Assignee.trim() || mwChairman.trim(),
      },
      {
        section: 'TESOUROS DA PALAVRA DE DEUS',
        title: mwTreasures3.trim(),
        assignee: mwTreasures3Assignee.trim() || 'A designar',
      },
      {
        section: 'FAÇA SEU MELHOR NO MINISTÉRIO',
        title: mwMinistry4.trim(),
        description: mwMinistry4Desc.trim(),
        assignee: mwMinistry4Assignee.trim() || 'A designar',
        assistant: mwMinistry4Assistant.trim() || undefined,
      },
      {
        section: 'FAÇA SEU MELHOR NO MINISTÉRIO',
        title: mwMinistry5.trim(),
        description: mwMinistry5Desc.trim(),
        assignee: mwMinistry5Assignee.trim() || 'A designar',
        assistant: mwMinistry5Assistant.trim() || undefined,
      },
      {
        section: 'FAÇA SEU MELHOR NO MINISTÉRIO',
        title: mwMinistry6.trim(),
        description: mwMinistry6Desc.trim(),
        assignee: mwMinistry6Assignee.trim() || 'A designar',
        assistant: mwMinistry6Assistant.trim() || undefined,
      },
      {
        section: 'NOSSA VIDA CRISTÃ',
        title: mwLivingSong.trim(),
        assignee: '',
      },
      {
        section: 'NOSSA VIDA CRISTÃ',
        title: mwLiving7.trim(),
        assignee: mwLiving7Assignee.trim() || mwChairman.trim(),
      },
      {
        section: 'NOSSA VIDA CRISTÃ',
        title: mwLiving8.trim(),
        description: mwLiving8Desc.trim(),
        assignee: mwLiving8Assignee.trim() || mwChairman.trim(),
        assistant: mwLiving8Assistant.trim() || undefined,
      },
      {
        section: 'ÁUDIO/VÍDEO & INDICADORES',
        title: 'Áudio',
        assignee: mwAudioName.trim(),
        assistant: mwAudioRole.trim(),
      },
      {
        section: 'ÁUDIO/VÍDEO & INDICADORES',
        title: 'Microfone Volante',
        assignee: mwMic1Name.trim(),
        assistant: mwMic1Role.trim(),
        description: mwMic2Name.trim() ? `${mwMic2Name.trim()}|${mwMic2Role.trim()}` : '',
      },
      {
        section: 'ÁUDIO/VÍDEO & INDICADORES',
        title: 'Indicador',
        assignee: mwInd1Name.trim(),
        assistant: mwInd1Role.trim(),
        description: mwInd2Name.trim() ? `${mwInd2Name.trim()}|${mwInd2Role.trim()}` : '',
      },
    ];

    try {
      const isEditing = Boolean(editingMidweekId);
      const endpoint = isEditing
        ? `${API_URL}/midweek-meetings/${editingMidweekId}`
        : `${API_URL}/midweek-meetings`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekLabel: mwWeekLabel.trim(),
          chairman: mwChairman.trim(),
          openingPrayer: mwOpeningPrayer.trim() || mwChairman.trim(),
          closingPrayer: mwClosingPrayer.trim() || mwChairman.trim(),
          parts,
          actorId: currentUser?.id,
        }),
      });

      if (res.ok) {
        setShowNewMidweekForm(false);
        setEditingMidweekId(null);
        await carregarDadosDoBanco();
        alert(
          isEditing
            ? '✏️ Reunião do meio de semana atualizada no PostgreSQL!'
            : '📖 Programação do meio de semana salva no PostgreSQL!'
        );
      }
    } catch {
      alert('Erro ao salvar reunião do meio de semana.');
    }
  };

  const removerReuniaoMeioSemana = async (id: string) => {
    if (!podeEnviarDesignacoes) return;
    try {
      const res = await fetch(`${API_URL}/midweek-meetings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await carregarDadosDoBanco();
      }
    } catch {
      alert('Erro ao remover programação do meio de semana.');
    }
  };

  const criarEscalaLimpeza = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeEnviarDesignacoes || !cleanWeekLabel.trim() || !cleanGroupName.trim()) return;

    try {
      const res = await fetch(`${API_URL}/cleaning-schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekLabel: cleanWeekLabel.trim(),
          groupName: cleanGroupName.trim(),
          notes: cleanNotes.trim() || null,
          actorId: currentUser?.id,
        }),
      });

      if (res.ok) {
        setCleanWeekLabel('');
        setCleanNotes('');
        setShowNewCleaningForm(false);
        await carregarDadosDoBanco();
        alert('🧹 Escala de limpeza salva no PostgreSQL!');
      }
    } catch {
      alert('Erro ao salvar escala de limpeza.');
    }
  };

  const removerEscalaLimpeza = async (id: string) => {
    if (!podeEnviarDesignacoes) return;
    try {
      const res = await fetch(`${API_URL}/cleaning-schedules/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await carregarDadosDoBanco();
      }
    } catch {
      alert('Erro ao remover escala de limpeza.');
    }
  };

  const alternarPermissaoMembro = async (
    targetMember: MemberProfile,
    campo: 'canUseTimer' | 'canViewAllHours' | 'canAssignParts'
  ) => {
    if (!currentUser || !podeGerirPermissoes) return;
    const valorAtual =
      campo === 'canUseTimer'
        ? Boolean(targetMember.canUseTimer)
        : campo === 'canViewAllHours'
        ? Boolean(targetMember.canViewAllHours)
        : Boolean(targetMember.canAssignParts);

    try {
      const res = await fetch(`${API_URL}/members/${targetMember.id}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorId: currentUser.id,
          [campo]: !valorAtual,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.error) {
          alert(`⚠️ ${data.error}`);
          return;
        }
        await carregarDadosDoBanco();
      }
    } catch {
      alert('Erro ao atualizar permissão no banco.');
    }
  };

  const confirmarRemocaoMembro = async (targetMember: MemberProfile) => {
    if (!currentUser || !podeGerirPermissoes) {
      alert('🔒 Apenas Anciãos e Desenvolvedores podem remover membros.');
      return;
    }

    if (!deletePassword.trim()) {
      alert('🔑 Digite a sua senha para confirmar a remoção.');
      return;
    }

    setDeletingMember(true);
    try {
      const query = new URLSearchParams({
        actorId: currentUser.id,
        pin: deletePassword.trim(),
      });

      const res = await fetch(`${API_URL}/members/${targetMember.id}?${query.toString()}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || data.deleted === false) {
        alert(`⚠️ ${data.error || 'Não foi possível remover o membro.'}`);
        return;
      }

      setMemberToDeleteId(null);
      setDeletePassword('');
      await carregarDadosDoBanco();
      alert(`🗑️ Membro "${data.removedName || targetMember.name}" removido do PostgreSQL.`);
    } catch {
      alert('Erro de conexão ao tentar remover o membro.');
    } finally {
      setDeletingMember(false);
    }
  };

  const enviarRelatorioMensalNoBanco = async (horasTotais: number) => {
    if (!currentUser) return;
    const obsFinal =
      observacoesRelatorio.trim() ||
      (!ehPioneiro
        ? `Participou da pregação: ${participouPregacao ? 'Sim' : 'Não'}`
        : '');

    try {
      const res = await fetch(`${API_URL}/reports/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: currentUser.id,
          monthYear: MES_ATUAL,
          totalHours: ehPioneiro ? horasTotais : 0,
          revisitas,
          estudos,
          observacoes: obsFinal,
        }),
      });

      if (res.ok) {
        await carregarDadosDoBanco();
        alert(`📊 Relatório de Novembro/2026 de ${currentUser.name} enviado ao Secretário e salvo no PostgreSQL!`);
      }
    } catch {
      alert('Sem conexão para enviar o relatório no momento.');
    }
  };

  const localizarMeuGps = () => {
    if (!navigator.geolocation) {
      alert('GPS não suportado neste navegador.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFocoMapa([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {
        setFocoMapa([-9.9482, -67.8285]);
      }
    );
  };

  const cadastrarNovoMembro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    try {
      const res = await fetch(`${API_URL}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          phone: newPhone,
          pin: '1234',
          role: newRole,
          monthlyGoal: newGoal,
          yearlyGoal: newGoal * 12,
          serviceGroup: newGroup,
        }),
      });

      if (res.ok) {
        const criado: MemberProfile = await res.json();
        await carregarDadosDoBanco();
        aplicarUtilizador(criado);
        setShowNewMemberForm(false);
        setNewName('');
        setNewPhone('');
        alert(`🎉 Membro "${criado.name}" registado com sucesso no PostgreSQL!`);
      }
    } catch {
      alert('Erro ao registar membro. Verifique se o backend está a correr.');
    }
  };

  const selecionarUsuario = (u: MemberProfile) => {
    aplicarUtilizador(u);
    setActiveTab('inicio');
  };

  const cardStyle = darkMode
    ? 'bg-[#1A261C] border-[#2F4231] text-[#EAECE9]'
    : 'bg-[#F4F5F0] border-[#D5DDD3] text-[#1C281D]';

  if (!currentUser) {
    return (
      <div className="bg-[#121A13] text-[#EAECE9] min-h-screen flex items-center justify-center p-5 font-sans">
        <div className="max-w-sm w-full bg-[#1A261C] border border-[#2F4231] rounded-3xl p-6 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#253526] border border-[#4A634C] flex items-center justify-center text-2xl mb-3">
            🌿
          </div>
          <h1 className="text-xl font-extrabold text-center uppercase tracking-wider">
            Horto Florestal <span className="text-xs bg-[#8FA38B] text-[#121A13] px-1.5 py-0.5 rounded">APP</span>
          </h1>
          <p className="text-xs text-center text-[#A5B8A3] mt-1 mb-5">
            {loadingDb ? 'A ligar ao PostgreSQL...' : 'Escolha o seu nome ou registe-se na congregação:'}
          </p>

          {!showNewMemberForm ? (
            <>
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {members.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => selecionarUsuario(u)}
                    className="w-full p-3.5 rounded-xl bg-[#233325] hover:bg-[#2F4432] border border-[#3A523D] flex justify-between items-center text-left transition cursor-pointer"
                  >
                    <div>
                      <strong className="text-sm block text-white">{u.name}</strong>
                      <span className="text-[11px] text-[#A5B8A3]">{u.serviceGroup}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-[#466044] text-white">
                      {u.role.replace('_', ' ')}
                    </span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowNewMemberForm(true)}
                className="mt-4 w-full py-3 rounded-xl font-bold text-xs uppercase bg-[#466044] hover:bg-[#537150] text-white cursor-pointer"
              >
                + Cadastrar Novo Membro no Banco
              </button>
            </>
          ) : (
            <form onSubmit={cadastrarNovoMembro} className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 text-[#A5B8A3]">Nome Completo:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Lucas Oliveira"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#121A13] border border-[#3A523D] text-white"
                />
              </div>
              <div>
                <label className="block mb-1 text-[#A5B8A3]">Telefone / WhatsApp:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 68999991234"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#121A13] border border-[#3A523D] text-white"
                />
              </div>
              <div>
                <label className="block mb-1 text-[#A5B8A3]">Cargo / Modalidade:</label>
                <select
                  value={newRole}
                  onChange={(e) => {
                    setNewRole(e.target.value);
                    if (e.target.value === 'PIONEIRO_REGULAR') setNewGoal(50);
                    else if (e.target.value === 'PIONEIRO_AUXILIAR') setNewGoal(30);
                    else setNewGoal(0);
                  }}
                  className="w-full p-2.5 rounded-lg bg-[#121A13] border border-[#3A523D] text-white"
                >
                  <option value="PUBLICADOR">Publicador</option>
                  <option value="PIONEIRO_AUXILIAR">Pioneiro Auxiliar (30h)</option>
                  <option value="PIONEIRO_REGULAR">Pioneiro Regular (50h)</option>
                  <option value="ANCIAO">Ancião</option>
                  <option value="DESENVOLVEDOR">Desenvolvedor</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-[#A5B8A3]">Grupo de Campo:</label>
                <input
                  type="text"
                  value={newGroup}
                  onChange={(e) => setNewGroup(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#121A13] border border-[#3A523D] text-white"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewMemberForm(false)}
                  className="flex-1 py-2.5 rounded-lg border border-[#4A634C] text-[#EAECE9] cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg font-bold bg-[#466044] text-white cursor-pointer"
                >
                  Salvar no Banco
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  const logsDoBanco = currentUser.timeLogs || [];
  const segundosNoBanco = logsDoBanco.reduce((acc, item) => acc + item.durationSec, 0);
  const overridesDoMembro = horasAjustadasPorMembro[currentUser.id] || {};

  const resumoPorDia: Record<number, { horas: number; revisitas: number; estudos: number; sessoes: number }> = {};
  for (let d = 1; d <= DIAS_NOVEMBRO; d++) {
    const temOverride = overridesDoMembro[d] !== undefined;
    resumoPorDia[d] = {
      horas: temOverride ? overridesDoMembro[d] : HORAS_BASE_POR_DIA[d] || 0,
      revisitas: 0,
      estudos: 0,
      sessoes: temOverride ? (overridesDoMembro[d] > 0 ? 1 : 0) : HORAS_BASE_POR_DIA[d] ? 1 : 0,
    };
  }

  logsDoBanco.forEach((l) => {
    const match = l.date.match(/^(\d{2})\/11/);
    if (match) {
      const dia = Number(match[1]);
      if (dia >= 1 && dia <= DIAS_NOVEMBRO && overridesDoMembro[dia] === undefined) {
        resumoPorDia[dia].horas = +(resumoPorDia[dia].horas + l.durationSec / 3600).toFixed(2);
        resumoPorDia[dia].revisitas += l.revisitas || 0;
        resumoPorDia[dia].estudos += l.estudos || 0;
        resumoPorDia[dia].sessoes += 1;
      }
    }
  });

  const totalHorasCalendario = +Object.values(resumoPorDia)
    .reduce((acc, item) => acc + item.horas, 0)
    .toFixed(2);

  const horasSalvas = +(totalHorasCalendario + segundosNoBanco / 3600).toFixed(2);
  const metaMensal = currentUser.monthlyGoal || 50;
  const metaAnual = currentUser.yearlyGoal || (metaMensal > 0 ? metaMensal * 12 : 600);

  const horasRelatoriosAnteriores = (currentUser.monthlyReports || [])
    .filter((r) => r.monthYear !== MES_ATUAL)
    .reduce((acc, r) => acc + r.totalHours, 0);
  const horasAnoAcumuladas = +(horasRelatoriosAnteriores + horasSalvas).toFixed(2);
  const faltamNoMes = Math.max(0, +(metaMensal - horasSalvas).toFixed(2));
  const faltamNoAno = Math.max(0, +(metaAnual - horasAnoAcumuladas).toFixed(2));
  const progressoPercentual = Math.min(Math.round((horasSalvas / metaMensal) * 100), 100);

  const infoDiaSelecionado = resumoPorDia[diaSelecionadoCalendario] || {
    horas: 0,
    revisitas: 0,
    estudos: 0,
    sessoes: 0,
  };

  const meuRelatorioMes = (currentUser.monthlyReports || []).find((r) => r.monthYear === MES_ATUAL);

  const listaSemanasDisponiveis = (() => {
    const porChaveBanco = new Map<string, MidweekMeetingItem>();
    midweekMeetings.forEach((m) => {
      porChaveBanco.set(normalizeWeekKey(m.weekLabel), m);
    });

    const usadas = new Set<string>();
    const resultado: MidweekMeetingItem[] = SEMANAS_PADRAO_HOURGLASS.map((padrao) => {
      const chave = normalizeWeekKey(padrao.weekLabel);
      const doBanco = porChaveBanco.get(chave);
      if (doBanco) {
        usadas.add(doBanco.id);
        const partesBanco = parseParts(doBanco.partsJson);
        if (partesBanco.length > 0) {
          return {
            ...doBanco,
            weekLabel: padrao.weekLabel,
          };
        }
      }
      return padrao;
    });

    midweekMeetings.forEach((m) => {
      if (!usadas.has(m.id)) {
        resultado.push(m);
      }
    });

    return resultado;
  })();

  const indiceSeguro =
    selectedWeekIndex < listaSemanasDisponiveis.length ? selectedWeekIndex : 0;
  const semanaSelecionada = listaSemanasDisponiveis[indiceSeguro] || null;
  const partesSemana = semanaSelecionada ? parseParts(semanaSelecionada.partsJson) : [];
  const parteCabecalho = partesSemana.find((p) => p.section === 'Cabecalho');
  const partesTesouros = partesSemana.filter((p) => p.section === 'TESOUROS DA PALAVRA DE DEUS');
  const partesMinisterio = partesSemana.filter((p) => p.section === 'FAÇA SEU MELHOR NO MINISTÉRIO');
  const partesVidaCrista = partesSemana.filter((p) => p.section === 'NOSSA VIDA CRISTÃ');
  const partesAudioIndicadores = partesSemana.filter(
    (p) => p.section === 'ÁUDIO/VÍDEO & INDICADORES'
  );

  const listaAudioIndicadores: MidweekPart[] =
    partesAudioIndicadores.length > 0
      ? partesAudioIndicadores
      : [
          {
            section: 'ÁUDIO/VÍDEO & INDICADORES',
            title: 'Áudio',
            assignee: 'Anselmo',
            assistant: 'Áudio e Vídeo',
          },
          {
            section: 'ÁUDIO/VÍDEO & INDICADORES',
            title: 'Microfone Volante',
            assignee: 'James',
            assistant: 'Palco e Microfone',
            description: 'Gabriel S. Aguiar|Microfone',
          },
          {
            section: 'ÁUDIO/VÍDEO & INDICADORES',
            title: 'Indicador',
            assignee: 'Jesuino',
            assistant: 'Interno',
            description: 'Edgard|Externo',
          },
        ];

  const canticoFinalTexto =
    parteCabecalho?.assignee || 'Cântico 74: A canção do Reino';

  const escolherSemanaNoModal = (idx: number) => {
    setShowWeekModal(false);
    setShowNewMidweekForm(false);
    setEditingMidweekId(null);
    setSwitchingWeek(true);
    setSelectedWeekIndex(idx);
    setScheduleSubTab('meio_de_semana');
    setTimeout(() => {
      setSwitchingWeek(false);
    }, 220);
  };

  return (
    <div className={darkMode ? 'bg-[#121A13] text-[#EAECE9] min-h-screen' : 'bg-[#2C3A2B] text-white min-h-screen'}>
      <div className="max-w-md mx-auto p-5 flex flex-col justify-between min-h-screen font-sans">
        <div>
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 px-3 rounded-full bg-[#1E2B20] border border-[#3A4D3C] text-xs font-medium cursor-pointer text-white"
            >
              {darkMode ? '🌙 Noturno' : '☀️ Claro'}
            </button>

            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                  isOnline
                    ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                    : 'bg-[#253226] border-[#526953] text-[#B7C9B5]'
                }`}
              >
                {isOnline ? '🗄️ PostgreSQL Online' : '⚡ Offline'}
              </span>

              <button
                onClick={() => aplicarUtilizador(null)}
                className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#2C3E2E] border border-[#4A634C] text-[#EAECE9] cursor-pointer"
              >
                👤 Trocar ({members.length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#253526] border border-[#4A634C] flex items-center justify-center font-bold text-lg">
              🌿
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-wider uppercase leading-tight">
                Horto Florestal <span className="text-[10px] bg-[#8FA38B] text-[#121A13] px-1.5 py-0.5 rounded">APP</span>
              </h1>
              <p className="text-sm text-[#A5B8A3]">
                Olá, <strong className="text-white">{currentUser.name}</strong>! • <span className="text-xs">{currentUser.role.replace('_', ' ')}</span>
              </p>
            </div>
          </div>

          {activeTab === 'inicio' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between py-2 px-1">
                <div>
                  <span className="text-xs text-[#A5B8A3] block">Programação</span>
                  <strong className="text-lg font-extrabold text-white">
                    {semanaSelecionada ? semanaSelecionada.weekLabel : '16–22 de nov. de 2026'}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('escalas');
                    setScheduleSubTab('meio_de_semana');
                  }}
                  className="px-4 py-1.5 rounded-full font-bold text-sm bg-[#C89B3C] hover:bg-[#d8ab4c] text-[#121A13] cursor-pointer"
                >
                  Ver
                </button>
              </div>

              {ehPioneiro ? (
                <>
                  <div className="flex items-center justify-between px-1">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-[#8FA38B] font-bold block">
                        Novembro 2026 • Hourglass
                      </span>
                      <span className="text-xs font-semibold text-white">
                        {podeAtivarCronometro
                          ? isElderOrDev(currentUser)
                            ? 'Cronômetro Liberado (Ancião / Dev)'
                            : 'Cronômetro Liberado pelo Ancião/Dev'
                          : 'Bloqueado (Requer liberação de Ancião/Dev)'}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                        podeAtivarCronometro
                          ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700'
                          : 'bg-amber-950/70 text-amber-300 border-amber-700'
                      }`}
                    >
                      {podeAtivarCronometro ? '🔓 Liberado' : '🔒 Bloqueado'}
                    </span>
                  </div>

                  <div className={`rounded-3xl p-6 text-center shadow-xl border ${cardStyle}`}>
                    <div
                      className={`w-48 h-48 mx-auto rounded-full border-[10px] flex flex-col items-center justify-center mb-5 transition ${
                        podeAtivarCronometro
                          ? isRunning
                            ? 'border-emerald-500 shadow-[0_0_24px_rgba(34,197,94,0.22)]'
                            : 'border-[#4A6B4D]'
                          : 'border-[#39473A] opacity-85'
                      }`}
                    >
                      <span className="text-[10px] uppercase tracking-widest opacity-70 mb-1">
                        {isRunning ? 'Em andamento' : podeAtivarCronometro ? 'Pronto para iniciar' : 'Bloqueado'}
                      </span>
                      <span className="text-4xl font-mono font-extrabold tracking-tight">
                        {formatTime(elapsedSeconds)}
                      </span>
                      <span className="text-[11px] text-[#8FA38B] font-semibold mt-1.5">
                        Mês: {horasSalvas}h
                      </span>
                    </div>

                    {podeAtivarCronometro ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={alternarCronometro}
                            className="py-3 px-4 rounded-xl font-bold uppercase text-xs tracking-wider bg-[#466044] hover:bg-[#537150] text-white cursor-pointer"
                          >
                            {isRunning ? '⏸ Pausar' : '▶ Iniciar'}
                          </button>
                          <button
                            onClick={finalizarSessao}
                            disabled={elapsedSeconds === 0}
                            className="py-3 px-4 rounded-xl font-bold uppercase text-xs tracking-wider bg-[#EAECE9] text-[#1A261C] disabled:opacity-40 cursor-pointer"
                          >
                            ⏹ Salvar
                          </button>
                        </div>
                        {elapsedSeconds > 0 && (
                          <button
                            type="button"
                            onClick={zerarCronometroAtual}
                            className="w-full py-2 rounded-xl font-semibold text-xs bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800/70 cursor-pointer"
                          >
                            ↺ Zerar Tempo do Relógio
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-2xl p-3.5 bg-[#121A13]/60 border border-[#2F4231] text-left">
                        <p className="text-xs font-bold text-amber-300">
                          🔒 Cronômetro bloqueado para este membro
                        </p>
                        <p className="text-[11px] opacity-80 mt-0.5">
                          Um Ancião ou Desenvolvedor pode liberar o cronômetro na aba Relatórios.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className={`rounded-2xl p-3 border ${cardStyle}`}>
                      <span className="text-[10px] uppercase opacity-70 block">Horas Mês</span>
                      <strong className="text-base font-extrabold">{horasSalvas}h</strong>
                    </div>
                    <div className={`rounded-2xl p-3 border ${cardStyle}`}>
                      <span className="text-[10px] uppercase opacity-70 block">Revisitas</span>
                      <strong className="text-base font-extrabold">{revisitas}</strong>
                    </div>
                    <div className={`rounded-2xl p-3 border ${cardStyle}`}>
                      <span className="text-[10px] uppercase opacity-70 block">Estudos</span>
                      <strong className="text-base font-extrabold">{estudos}</strong>
                    </div>
                  </div>

                  {podeVerMyService && (
                    <div className={`rounded-2xl p-4 border space-y-3 ${cardStyle}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-extrabold block">
                            My Service • Metas e Calendário
                          </span>
                          <strong className="text-xs">
                            {currentUser.role.replace('_', ' ')} • Meta Mensal {metaMensal}h / Anual {metaAnual}h
                          </strong>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold">
                          {progressoPercentual}%
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-[#121A13]/50 border border-[#2F4231]">
                          <span className="text-[10px] opacity-75 block">Faltam no Mês</span>
                          <strong className="text-sm text-amber-300">{faltamNoMes}h</strong>
                          <span className="text-[10px] opacity-70 block">Feitas: {horasSalvas}h / {metaMensal}h</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#121A13]/50 border border-[#2F4231]">
                          <span className="text-[10px] opacity-75 block">Faltam no Ano</span>
                          <strong className="text-sm text-emerald-300">{faltamNoAno}h</strong>
                          <span className="text-[10px] opacity-70 block">Feitas: {horasAnoAcumuladas}h / {metaAnual}h</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-[11px] mb-2">
                          <span className="font-bold">Calendário • Novembro 2026</span>
                          <span className="text-[#8FA38B]">Dia {diaSelecionadoCalendario}/11</span>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
                          {Array.from({ length: DIAS_NOVEMBRO }, (_, idx) => {
                            const dia = idx + 1;
                            const infoDia = resumoPorDia[dia];
                            const temHoras = infoDia.horas > 0;
                            const selecionado = diaSelecionadoCalendario === dia;
                            return (
                              <button
                                key={dia}
                                onClick={() => setDiaSelecionadoCalendario(dia)}
                                className={`py-1 px-0.5 rounded-lg font-semibold transition cursor-pointer flex flex-col items-center leading-tight ${
                                  selecionado
                                    ? 'bg-[#466044] text-white ring-1 ring-emerald-300'
                                    : temHoras
                                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                                    : 'bg-[#121A13]/40 text-[#A5B8A3] hover:bg-[#233325]'
                                }`}
                              >
                                <span>{dia}</span>
                                <span className="text-[9px] opacity-90">
                                  {temHoras ? `${infoDia.horas}h` : '-'}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="text-[11px] opacity-90 mt-2 bg-[#121A13]/50 border border-[#2F4231] px-3 py-2 rounded-xl flex justify-between items-center gap-2">
                          <div>
                            <strong className="block text-white">
                              Dia {diaSelecionadoCalendario}/11 • {infoDiaSelecionado.horas}h marcadas
                            </strong>
                            <span className="text-[10px] opacity-75">
                              Toque para ajustar ou remover as horas deste dia
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {infoDiaSelecionado.horas > 0 && (
                              <button
                                type="button"
                                onClick={() => removerHorasDoDiaNoCalendario(diaSelecionadoCalendario)}
                                className="px-2 py-1 rounded-lg bg-red-950/90 hover:bg-red-900 text-red-200 border border-red-800/70 text-[10px] font-bold cursor-pointer"
                              >
                                ✕ Remover dia
                              </button>
                            )}
                            <span className="text-xs font-extrabold text-emerald-300">
                              {infoDiaSelecionado.horas}h
                            </span>
                          </div>
                        </div>

                        <form onSubmit={aplicarHorasDigitadasNoDia} className="mt-2.5 flex gap-1.5">
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder={`Horas no dia ${diaSelecionadoCalendario}/11 (ex: 1 ou 1.5)`}
                            value={horasDiaInput}
                            onChange={(e) => setHorasDiaInput(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#121A13] border border-[#3A523D] text-white text-xs"
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 rounded-lg bg-[#466044] hover:bg-[#537150] text-white text-xs font-bold cursor-pointer"
                          >
                            Salvar dia
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className={`rounded-2xl p-4 border space-y-3 ${cardStyle}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold">Participou da pregação no mês?</span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        participouPregacao
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : 'bg-[#233325] text-[#A5B8A3] border-[#3A523D]'
                      }`}
                    >
                      {participouPregacao ? '✓ Sim' : 'Não'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => alternarParticipacaoPregacao(true)}
                      className={`py-2.5 rounded-xl font-bold text-xs cursor-pointer border ${
                        participouPregacao
                          ? 'bg-[#466044] text-white border-emerald-400'
                          : 'bg-[#121A13]/60 text-[#A5B8A3] border-[#2F4231]'
                      }`}
                    >
                      ✓ Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => alternarParticipacaoPregacao(false)}
                      className={`py-2.5 rounded-xl font-bold text-xs cursor-pointer border ${
                        !participouPregacao
                          ? 'bg-[#2E3E30] text-white border-[#648C61]'
                          : 'bg-[#121A13]/60 text-[#A5B8A3] border-[#2F4231]'
                      }`}
                    >
                      ✕ Não
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className={`border rounded-xl p-3 flex items-center justify-between ${cardStyle}`}>
                  <span className="text-xs font-semibold">Revisitas: {revisitas}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setRevisitas(Math.max(0, revisitas - 1))}
                      className="w-7 h-7 rounded-lg bg-[#253526] text-white font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <button
                      onClick={() => setRevisitas(revisitas + 1)}
                      className="w-7 h-7 rounded-lg bg-[#466044] text-white font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className={`border rounded-xl p-3 flex items-center justify-between ${cardStyle}`}>
                  <span className="text-xs font-semibold">Estudos: {estudos}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEstudos(Math.max(0, estudos - 1))}
                      className="w-7 h-7 rounded-lg bg-[#253526] text-white font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <button
                      onClick={() => setEstudos(estudos + 1)}
                      className="w-7 h-7 rounded-lg bg-[#466044] text-white font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'escalas' && (
            <div className="relative space-y-4">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('inicio')}
                  className="w-9 h-9 rounded-full bg-[#1E201E] border border-[#343834] flex items-center justify-center text-white text-base font-bold cursor-pointer shrink-0"
                >
                  ‹
                </button>

                <button
                  type="button"
                  onClick={() => setShowWeekModal(!showWeekModal)}
                  className="bg-transparent hover:bg-[#1E261F] text-white text-sm font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{semanaSelecionada ? semanaSelecionada.weekLabel : '16–22 de nov. de 2026'}</span>
                  <span className="text-xs text-[#A5B8A3]">⌄</span>
                </button>

                {podeEnviarDesignacoes ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowWeekModal(false);
                      if (showNewMidweekForm) {
                        setShowNewMidweekForm(false);
                        setEditingMidweekId(null);
                      } else {
                        setEditingMidweekId(null);
                        setShowNewMidweekForm(true);
                      }
                    }}
                    className="text-[11px] bg-[#466044] hover:bg-[#537150] text-white px-2.5 py-1.5 rounded-xl font-bold cursor-pointer shrink-0"
                  >
                    {showNewMidweekForm ? '✕ Fechar' : '+ Semana'}
                  </button>
                ) : (
                  <div className="w-9" />
                )}
              </div>

              {showWeekModal && (
                <div
                  className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4"
                  onClick={() => setShowWeekModal(false)}
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="w-72 max-h-[75vh] overflow-y-auto rounded-3xl bg-[#252625] border border-[#3C3E3C] p-4 shadow-2xl space-y-2"
                  >
                    {listaSemanasDisponiveis.map((m, idx) => {
                      const isSelected = idx === indiceSeguro;
                      const linhas = formatWeekTwoLines(m.weekLabel);
                      return (
                        <button
                          key={`${m.id}-${idx}`}
                          type="button"
                          onClick={() => escolherSemanaNoModal(idx)}
                          className={`w-full py-2.5 px-3 rounded-2xl flex items-center justify-center relative text-center transition cursor-pointer ${
                            isSelected
                              ? 'bg-[#363836] text-white font-bold'
                              : 'text-[#EAECE9] hover:bg-[#2F312F]'
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute left-4 text-sm font-extrabold text-white">✓</span>
                          )}
                          <div className="leading-snug text-[15px]">
                            <span className="block">{linhas.top}</span>
                            {linhas.bottom && <span className="block">{linhas.bottom}</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 border-b border-[#2F4231] text-[11px] font-extrabold uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setScheduleSubTab('meio_de_semana')}
                  className={`py-2.5 text-center border-b-2 transition cursor-pointer ${
                    scheduleSubTab === 'meio_de_semana'
                      ? 'border-[#C89B3C] text-[#C89B3C]'
                      : 'border-transparent text-[#8FA38B]'
                  }`}
                >
                  Meio de Semana
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleSubTab('fim_de_semana')}
                  className={`py-2.5 text-center border-b-2 transition cursor-pointer ${
                    scheduleSubTab === 'fim_de_semana'
                      ? 'border-[#C89B3C] text-[#C89B3C]'
                      : 'border-transparent text-[#8FA38B]'
                  }`}
                >
                  Fim de Semana
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleSubTab('servico')}
                  className={`py-2.5 text-center border-b-2 transition cursor-pointer ${
                    scheduleSubTab === 'servico'
                      ? 'border-[#C89B3C] text-[#C89B3C]'
                      : 'border-transparent text-[#8FA38B]'
                  }`}
                >
                  Serviço
                </button>
              </div>

              {showNewMidweekForm && podeEnviarDesignacoes && (
                <form onSubmit={salvarReuniaoMeioSemana} className={`rounded-2xl p-4 border space-y-2.5 text-xs ${cardStyle}`}>
                  <h3 className="font-bold text-sm text-emerald-400">
                    {editingMidweekId
                      ? `Editar Partes • ${mwWeekLabel}`
                      : `Editar / Salvar Semana • ${mwWeekLabel}`}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block mb-1 opacity-80">Intervalo da Semana:</label>
                      <input
                        type="text"
                        required
                        value={mwWeekLabel}
                        onChange={(e) => setMwWeekLabel(e.target.value)}
                        className="w-full p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 opacity-80">Data da Reunião:</label>
                      <input
                        type="text"
                        value={mwMeetingDay}
                        onChange={(e) => setMwMeetingDay(e.target.value)}
                        className="w-full p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block mb-1 opacity-80">Leitura Bíblica:</label>
                      <input
                        type="text"
                        value={mwBibleReading}
                        onChange={(e) => setMwBibleReading(e.target.value)}
                        className="w-full p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 opacity-80">Cântico Inicial:</label>
                      <input
                        type="text"
                        value={mwOpeningSong}
                        onChange={(e) => setMwOpeningSong(e.target.value)}
                        className="w-full p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block mb-1 opacity-80">Presidente:</label>
                      <input
                        type="text"
                        required
                        placeholder="Nome"
                        value={mwChairman}
                        onChange={(e) => setMwChairman(e.target.value)}
                        className="w-full p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 opacity-80">Oração Inicial:</label>
                      <input
                        type="text"
                        placeholder="Nome"
                        value={mwOpeningPrayer}
                        onChange={(e) => setMwOpeningPrayer(e.target.value)}
                        className="w-full p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 opacity-80">Oração Final:</label>
                      <input
                        type="text"
                        placeholder="Nome"
                        value={mwClosingPrayer}
                        onChange={(e) => setMwClosingPrayer(e.target.value)}
                        className="w-full p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase text-[#3C7A89] block">Tesouros da Palavra de Deus</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" value={mwTreasures1} onChange={(e) => setMwTreasures1(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                      <input type="text" placeholder="Designado parte 1" value={mwTreasures1Assignee} onChange={(e) => setMwTreasures1Assignee(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" value={mwTreasures2} onChange={(e) => setMwTreasures2(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                      <input type="text" placeholder="Designado parte 2" value={mwTreasures2Assignee} onChange={(e) => setMwTreasures2Assignee(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" value={mwTreasures3} onChange={(e) => setMwTreasures3(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                      <input type="text" placeholder="Leitor da Bíblia" value={mwTreasures3Assignee} onChange={(e) => setMwTreasures3Assignee(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase text-[#C89B3C] block">Faça Seu Melhor no Ministério</span>
                    <div className="grid grid-cols-3 gap-2">
                      <input type="text" value={mwMinistry4} onChange={(e) => setMwMinistry4(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                      <input type="text" placeholder="Designado parte 4" value={mwMinistry4Assignee} onChange={(e) => setMwMinistry4Assignee(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                      <input type="text" placeholder="Ajudante parte 4" value={mwMinistry4Assistant} onChange={(e) => setMwMinistry4Assistant(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                    </div>
                    <input type="text" placeholder="Instrução parte 4" value={mwMinistry4Desc} onChange={(e) => setMwMinistry4Desc(e.target.value)} className="w-full p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />

                    <div className="grid grid-cols-3 gap-2">
                      <input type="text" value={mwMinistry5} onChange={(e) => setMwMinistry5(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                      <input type="text" placeholder="Designado parte 5" value={mwMinistry5Assignee} onChange={(e) => setMwMinistry5Assignee(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                      <input type="text" placeholder="Ajudante parte 5" value={mwMinistry5Assistant} onChange={(e) => setMwMinistry5Assistant(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                    </div>
                    <input type="text" placeholder="Instrução parte 5" value={mwMinistry5Desc} onChange={(e) => setMwMinistry5Desc(e.target.value)} className="w-full p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />

                    <div className="grid grid-cols-3 gap-2">
                      <input type="text" value={mwMinistry6} onChange={(e) => setMwMinistry6(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                      <input type="text" placeholder="Designado parte 6" value={mwMinistry6Assignee} onChange={(e) => setMwMinistry6Assignee(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                      <input type="text" placeholder="Ajudante parte 6" value={mwMinistry6Assistant} onChange={(e) => setMwMinistry6Assistant(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                    </div>
                    <input type="text" placeholder="Instrução parte 6" value={mwMinistry6Desc} onChange={(e) => setMwMinistry6Desc(e.target.value)} className="w-full p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase text-[#9E322F] block">Nossa Vida Cristã</span>
                    <input type="text" value={mwLivingSong} onChange={(e) => setMwLivingSong(e.target.value)} className="w-full p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" value={mwLiving7} onChange={(e) => setMwLiving7(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                      <input type="text" placeholder="Designado parte 7" value={mwLiving7Assignee} onChange={(e) => setMwLiving7Assignee(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input type="text" value={mwLiving8} onChange={(e) => setMwLiving8(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                      <input type="text" placeholder="Dirigente" value={mwLiving8Assignee} onChange={(e) => setMwLiving8Assignee(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                      <input type="text" placeholder="Leitor" value={mwLiving8Assistant} onChange={(e) => setMwLiving8Assistant(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                    </div>
                    <input type="text" placeholder="Capítulo / referência estudo" value={mwLiving8Desc} onChange={(e) => setMwLiving8Desc(e.target.value)} className="w-full p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                    <input type="text" placeholder="Cântico Final" value={mwClosingSong} onChange={(e) => setMwClosingSong(e.target.value)} className="w-full p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase text-[#3B825B] block">Áudio/Vídeo & Indicadores</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Operador de Áudio" value={mwAudioName} onChange={(e) => setMwAudioName(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                      <input type="text" placeholder="Função (ex: Áudio e Vídeo)" value={mwAudioRole} onChange={(e) => setMwAudioRole(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Microfone Volante 1" value={mwMic1Name} onChange={(e) => setMwMic1Name(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                      <input type="text" placeholder="Função (ex: Palco e Microfone)" value={mwMic1Role} onChange={(e) => setMwMic1Role(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Microfone Volante 2" value={mwMic2Name} onChange={(e) => setMwMic2Name(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                      <input type="text" placeholder="Função (ex: Microfone)" value={mwMic2Role} onChange={(e) => setMwMic2Role(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Indicador 1" value={mwInd1Name} onChange={(e) => setMwInd1Name(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                      <input type="text" placeholder="Função (ex: Interno)" value={mwInd1Role} onChange={(e) => setMwInd1Role(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Indicador 2" value={mwInd2Name} onChange={(e) => setMwInd2Name(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                      <input type="text" placeholder="Função (ex: Externo)" value={mwInd2Role} onChange={(e) => setMwInd2Role(e.target.value)} className="p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg font-bold bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer"
                  >
                    💾 Salvar Alterações desta Semana no PostgreSQL
                  </button>
                </form>
              )}

              {scheduleSubTab === 'meio_de_semana' && (
                <div className="space-y-4">
                  {switchingWeek ? (
                    <div className="py-16 flex justify-center items-center">
                      <div className="w-6 h-6 border-2 border-[#A5B8A3] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : semanaSelecionada ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h2 className="text-xl font-extrabold text-white leading-snug">
                            {parteCabecalho ? parteCabecalho.title.split(' • ')[0] : semanaSelecionada.weekLabel}
                          </h2>
                          {parteCabecalho && parteCabecalho.title.includes(' • ') && (
                            <p className="text-sm font-extrabold uppercase tracking-wide text-white mt-0.5">
                              {parteCabecalho.title.split(' • ')[1]}
                            </p>
                          )}
                        </div>
                        {podeEnviarDesignacoes && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => abrirEdicaoReuniaoMeioSemana(semanaSelecionada)}
                              className="px-2.5 py-1 rounded bg-[#253526] hover:bg-[#314733] text-white border border-[#4A634C] text-[10px] font-bold cursor-pointer"
                            >
                              ✏️ Editar Partes
                            </button>
                            {midweekMeetings.some((m) => m.id === semanaSelecionada.id) && (
                              <button
                                type="button"
                                onClick={() => removerReuniaoMeioSemana(semanaSelecionada.id)}
                                className="px-2 py-1 rounded bg-red-950/90 hover:bg-red-900 text-red-200 border border-red-800/70 text-[10px] font-bold cursor-pointer"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2.5 text-sm">
                        <div>
                          <span className="text-xs text-[#A5B8A3] block">Presidente</span>
                          <strong className="text-white font-bold text-base">{semanaSelecionada.chairman}</strong>
                        </div>
                        {parteCabecalho?.description && (
                          <p className="text-sm font-bold text-white">{parteCabecalho.description}</p>
                        )}
                        <div>
                          <span className="text-xs text-[#A5B8A3] block">Oração inicial</span>
                          <strong className="text-white font-bold text-base">{semanaSelecionada.openingPrayer}</strong>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-[#387482] text-white font-extrabold text-xs uppercase tracking-wider px-3 py-1.5">
                          Tesouros da Palavra de Deus
                        </div>
                        {partesTesouros.map((item, idx) => (
                          <div key={`t-${idx}`} className="space-y-0.5">
                            <p className="text-sm text-[#BDBFBD] leading-snug">{item.title}</p>
                            {item.description && <p className="text-xs text-[#A5B8A3]">{item.description}</p>}
                            {item.assignee && <p className="text-base font-extrabold text-white">{item.assignee}</p>}
                            {item.assistant && <p className="text-sm font-semibold text-[#BDBFBD]">{item.assistant}</p>}
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <div className="bg-[#99732C] text-white font-extrabold text-xs uppercase tracking-wider px-3 py-1.5">
                          Faça Seu Melhor no Ministério
                        </div>
                        {partesMinisterio.map((item, idx) => (
                          <div key={`m-${idx}`} className="space-y-0.5">
                            <p className="text-sm text-[#BDBFBD] leading-snug">
                              {item.title} {item.description ? item.description : ''}
                            </p>
                            {item.assignee && <p className="text-base font-extrabold text-white pt-0.5">{item.assignee}</p>}
                            {item.assistant && <p className="text-sm text-[#BDBFBD]">{item.assistant}</p>}
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <div className="bg-[#8F2D2B] text-white font-extrabold text-xs uppercase tracking-wider px-3 py-1.5">
                          Nossa Vida Cristã
                        </div>
                        {partesVidaCrista.map((item, idx) => {
                          const isSongOnly = !item.assignee;
                          return (
                            <div key={`v-${idx}`} className="space-y-0.5">
                              <p
                                className={
                                  isSongOnly
                                    ? 'text-sm font-extrabold text-white leading-snug'
                                    : 'text-sm text-[#BDBFBD] leading-snug'
                                }
                              >
                                {item.title}
                              </p>
                              {item.description && <p className="text-sm text-[#BDBFBD]">{item.description}</p>}
                              {item.assignee && <p className="text-base font-extrabold text-white">{item.assignee}</p>}
                              {item.assistant && <p className="text-sm text-[#BDBFBD]">{item.assistant}</p>}
                            </div>
                          );
                        })}
                      </div>

                      <div className="space-y-2.5 pt-1 text-sm">
                        <p className="text-sm font-extrabold text-white">{canticoFinalTexto}</p>
                        <div>
                          <span className="text-xs text-[#A5B8A3] block">Oração final</span>
                          <strong className="text-white font-bold text-base">{semanaSelecionada.closingPrayer}</strong>
                        </div>
                      </div>

                      <div className="space-y-3 pt-1">
                        <div className="bg-[#3B7A57] text-white font-extrabold text-xs uppercase tracking-wider px-3 py-1.5">
                          Áudio/Vídeo & Indicadores
                        </div>
                        {listaAudioIndicadores.map((item, idx) => {
                          const [segNome, segFuncao] = (item.description || '').split('|');
                          return (
                            <div key={`av-${idx}`} className="space-y-0.5">
                              <span className="text-xs text-[#A5B8A3] block">{item.title}</span>
                              {item.assignee && (
                                <p className="text-base text-white">
                                  <strong className="font-extrabold">{item.assignee}</strong>{' '}
                                  {item.assistant && (
                                    <em className="text-sm font-normal text-[#BDBFBD] italic">
                                      {item.assistant}
                                    </em>
                                  )}
                                </p>
                              )}
                              {segNome && (
                                <p className="text-base text-white">
                                  <strong className="font-extrabold">{segNome}</strong>{' '}
                                  {segFuncao && (
                                    <em className="text-sm font-normal text-[#BDBFBD] italic">
                                      {segFuncao}
                                    </em>
                                  )}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className={`rounded-2xl p-4 border text-xs opacity-80 ${cardStyle}`}>
                      Nenhuma programação cadastrada ainda.
                    </div>
                  )}
                </div>
              )}

              {scheduleSubTab === 'fim_de_semana' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xs uppercase tracking-widest text-[#8FA38B] font-bold">
                      Designações e Escalas ({escalas.length})
                    </h2>
                    {podeEnviarDesignacoes && (
                      <button
                        onClick={() => setShowNewAssignmentForm(!showNewAssignmentForm)}
                        className="text-[11px] bg-[#466044] hover:bg-[#537150] text-white px-2.5 py-1 rounded-lg font-bold cursor-pointer"
                      >
                        {showNewAssignmentForm ? '✕ Fechar' : '+ Nova Designação'}
                      </button>
                    )}
                  </div>

                  {showNewAssignmentForm && podeEnviarDesignacoes && (
                    <form onSubmit={criarNovaEscalaNoBanco} className={`rounded-2xl p-4 border space-y-2.5 text-xs ${cardStyle}`}>
                      <h3 className="font-bold text-sm text-emerald-400">Nova Escala / Discurso / Parte</h3>
                      <div>
                        <label className="block mb-1 opacity-80">Discurso, Parte ou Função:</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Discurso Público"
                          value={novoCargo}
                          onChange={(e) => setNovoCargo(e.target.value)}
                          className="w-full p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 opacity-80">Tema do discurso:</label>
                        <input
                          type="text"
                          placeholder="Ex: Como vencer o desânimo com a ajuda de Jeová"
                          value={novoTemaDiscurso}
                          onChange={(e) => setNovoTemaDiscurso(e.target.value)}
                          className="w-full p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block mb-1 opacity-80">Dia e Horário:</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Domingo, 22 Nov • 10:00"
                            value={novaDataEscala}
                            onChange={(e) => setNovaDataEscala(e.target.value)}
                            className="w-full p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white"
                          />
                        </div>
                        <div>
                          <label className="block mb-1 opacity-80">Local:</label>
                          <input
                            type="text"
                            value={novoLocalEscala}
                            onChange={(e) => setNovoLocalEscala(e.target.value)}
                            className="w-full p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block mb-1 opacity-80">Membro Designado:</label>
                        <select
                          value={membroDesignadoId}
                          onChange={(e) => setMembroDesignadoId(e.target.value)}
                          className="w-full p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white"
                        >
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.serviceGroup})
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-lg font-bold bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer"
                      >
                        💾 Salvar Designação no PostgreSQL
                      </button>
                    </form>
                  )}

                  {escalas.map((item) => {
                    const nomeResponsavel = item.member?.name || 'Membro';
                    const isMine = item.memberId === currentUser.id;
                    const isConfirmado = item.status === 'confirmado';
                    return (
                      <div key={item.id} className={`rounded-2xl p-4 border ${cardStyle} ${isMine ? 'ring-2 ring-[#648C61]' : ''}`}>
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h3 className="font-bold text-base">{item.cargo}</h3>
                            <p className="text-xs opacity-80">{item.data} • {item.local}</p>
                            <p className="text-xs font-semibold text-[#8FA38B] mt-1">
                              Designado: <strong className="text-white">{nomeResponsavel}</strong> {isMine && '(Você)'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                isConfirmado
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                  : 'bg-yellow-950 text-yellow-300 border border-yellow-700'
                              }`}
                            >
                              {item.status}
                            </span>
                            {podeEnviarDesignacoes && (
                              <button
                                type="button"
                                onClick={() => removerEscalaNoBanco(item.id)}
                                className="px-2 py-0.5 rounded bg-red-950/90 hover:bg-red-900 text-red-200 border border-red-800/70 text-[10px] font-bold cursor-pointer"
                              >
                                🗑️ Remover
                              </button>
                            )}
                          </div>
                        </div>
                        {isMine && !isConfirmado && (
                          <button
                            onClick={() => confirmarEscalaNoBanco(item.id)}
                            className="mt-3 w-full py-2 rounded-lg text-xs font-bold bg-[#466044] hover:bg-[#537150] text-white cursor-pointer"
                          >
                            ✓ Confirmar Minha Presença no BD
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {scheduleSubTab === 'servico' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xs uppercase tracking-widest text-[#8FA38B] font-bold">
                      Limpeza da Semana ({cleaningSchedules.length})
                    </h2>
                    {podeEnviarDesignacoes && (
                      <button
                        onClick={() => setShowNewCleaningForm(!showNewCleaningForm)}
                        className="text-[11px] bg-[#466044] hover:bg-[#537150] text-white px-2.5 py-1 rounded-lg font-bold cursor-pointer"
                      >
                        {showNewCleaningForm ? '✕ Fechar' : '+ Limpeza'}
                      </button>
                    )}
                  </div>

                  {showNewCleaningForm && podeEnviarDesignacoes && (
                    <form onSubmit={criarEscalaLimpeza} className={`rounded-2xl p-4 border space-y-2.5 text-xs ${cardStyle}`}>
                      <h3 className="font-bold text-sm text-emerald-400">Nova Escala de Limpeza</h3>
                      <div>
                        <label className="block mb-1 opacity-80">Semana:</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Semana de 23/11 a 29/11"
                          value={cleanWeekLabel}
                          onChange={(e) => setCleanWeekLabel(e.target.value)}
                          className="w-full p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 opacity-80">Grupo Responsável:</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Grupo 2 - Horto"
                          value={cleanGroupName}
                          onChange={(e) => setCleanGroupName(e.target.value)}
                          className="w-full p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 opacity-80">Observações:</label>
                        <input
                          type="text"
                          placeholder="Ex: Salão principal, banheiros e área externa"
                          value={cleanNotes}
                          onChange={(e) => setCleanNotes(e.target.value)}
                          className="w-full p-2 rounded-lg bg-[#121A13] border border-[#3A523D] text-white"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-lg font-bold bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer"
                      >
                        💾 Salvar Escala de Limpeza
                      </button>
                    </form>
                  )}

                  {cleaningSchedules.map((clean) => (
                    <div key={clean.id} className={`rounded-2xl p-4 border ${cardStyle}`}>
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-[#8FA38B] font-bold block">
                            {clean.weekLabel}
                          </span>
                          <h3 className="font-bold text-sm text-white mt-0.5">🧹 {clean.groupName}</h3>
                          {clean.notes && (
                            <p className="text-xs opacity-80 mt-1">{clean.notes}</p>
                          )}
                        </div>
                        {podeEnviarDesignacoes && (
                          <button
                            type="button"
                            onClick={() => removerEscalaLimpeza(clean.id)}
                            className="px-2 py-0.5 rounded bg-red-950/90 hover:bg-red-900 text-red-200 border border-red-800/70 text-[10px] font-bold cursor-pointer"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'territorios' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-xs uppercase tracking-widest text-[#8FA38B] font-bold">
                  Mapa de Territórios • Horto ({territorios.length})
                </h2>
                <button
                  onClick={localizarMeuGps}
                  className="text-[11px] bg-[#253526] hover:bg-[#314733] border border-[#4A634C] text-white px-2.5 py-1 rounded-lg font-semibold cursor-pointer"
                >
                  📍 Centralizar no Horto
                </button>
              </div>

              <TerritoryMap
                territorios={territorios}
                focoCoords={focoMapa}
                onSelectTerritory={(id) => setTerritorioDestacado(id)}
              />

              {territorios.map((t) => {
                const isDisponivel = t.status === 'Disponível';
                const isDestacado = territorioDestacado === t.id;
                return (
                  <div
                    key={t.id}
                    className={`rounded-2xl p-4 border transition ${cardStyle} ${
                      isDestacado ? 'ring-2 ring-emerald-400' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded text-white ${
                          isDisponivel ? 'bg-emerald-700' : 'bg-yellow-700'
                        }`}
                      >
                        {t.id}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isDisponivel
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            : 'bg-yellow-950 text-yellow-300 border border-yellow-700'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm mt-1.5">{t.nome}</h3>
                    <p className="text-xs opacity-75">
                      Responsável atual: <strong>{t.responsavel}</strong> • {t.quadras} quadras
                    </p>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => {
                          setTerritorioDestacado(t.id);
                          setFocoMapa([t.lat, t.lng]);
                        }}
                        className="flex-1 py-2 rounded-lg text-xs font-bold bg-[#253526] hover:bg-[#2F4432] border border-[#4A634C] text-white cursor-pointer"
                      >
                        🔍 Focar no Mapa
                      </button>

                      {isDisponivel ? (
                        <button
                          onClick={() => atualizarTerritorioNoBanco(t.id, 'Em andamento', currentUser.name)}
                          className="flex-1 py-2 rounded-lg text-xs font-bold bg-[#466044] hover:bg-[#537150] text-white cursor-pointer"
                        >
                          ✋ Assumir ({currentUser.name})
                        </button>
                      ) : (
                        (t.responsavel === currentUser.name || isElderOrDev(currentUser)) && (
                          <button
                            onClick={() => atualizarTerritorioNoBanco(t.id, 'Disponível', 'Livre')}
                            className="flex-1 py-2 rounded-lg text-xs font-bold bg-emerald-800 hover:bg-emerald-700 text-white cursor-pointer"
                          >
                            ✓ Concluir / Devolver
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'relatorios' && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xs uppercase tracking-widest text-[#8FA38B] font-bold">
                  Relatório Novembro/2026 • {currentUser.name}
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    meuRelatorioMes
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'bg-yellow-950 text-yellow-300 border border-yellow-700'
                  }`}
                >
                  {meuRelatorioMes ? '✅ Entregue no BD' : '⏳ Pendente de envio'}
                </span>
              </div>

              <div className={`rounded-2xl p-4 border mb-4 ${cardStyle}`}>
                {ehPioneiro ? (
                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    <div className="p-2 rounded-xl bg-[#121A13]/40">
                      <span className="text-xs opacity-75 block">Horas</span>
                      <strong className="text-lg">{horasSalvas}h</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-[#121A13]/40">
                      <span className="text-xs opacity-75 block">Revisitas</span>
                      <strong className="text-lg">{revisitas}</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-[#121A13]/40">
                      <span className="text-xs opacity-75 block">Estudos</span>
                      <strong className="text-lg">{estudos}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 mb-3">
                    <div className="p-3 rounded-xl bg-[#121A13]/40 border border-[#2F4231]">
                      <span className="text-xs opacity-80 block mb-2 font-semibold">
                        Participou da pregação?
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => alternarParticipacaoPregacao(true)}
                          className={`py-2 rounded-lg font-bold text-xs cursor-pointer border ${
                            participouPregacao
                              ? 'bg-[#466044] text-white border-emerald-400'
                              : 'bg-[#121A13]/60 text-[#A5B8A3] border-[#2F4231]'
                          }`}
                        >
                          ✓ Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => alternarParticipacaoPregacao(false)}
                          className={`py-2 rounded-lg font-bold text-xs cursor-pointer border ${
                            !participouPregacao
                              ? 'bg-[#2E3E30] text-white border-[#648C61]'
                              : 'bg-[#121A13]/60 text-[#A5B8A3] border-[#2F4231]'
                          }`}
                        >
                          ✕ Não
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-2 rounded-xl bg-[#121A13]/40">
                        <span className="text-xs opacity-75 block">Revisitas</span>
                        <strong className="text-lg">{revisitas}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-[#121A13]/40">
                        <span className="text-xs opacity-75 block">Estudos</span>
                        <strong className="text-lg">{estudos}</strong>
                      </div>
                    </div>
                  </div>
                )}

                <input
                  type="text"
                  placeholder="Observações para o Secretário (opcional)..."
                  value={observacoesRelatorio}
                  onChange={(e) => setObservacoesRelatorio(e.target.value)}
                  className="w-full p-2.5 mb-2.5 rounded-xl bg-[#121A13] border border-[#3A523D] text-xs text-white"
                />

                <button
                  onClick={() => enviarRelatorioMensalNoBanco(horasSalvas)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold uppercase bg-[#466044] hover:bg-[#537150] text-white cursor-pointer"
                >
                  {meuRelatorioMes
                    ? '🔄 Atualizar Relatório de Novembro no Banco'
                    : '📤 Enviar Relatório de Novembro ao Secretário'}
                </button>
              </div>

              {podeVerTodasHoras ? (
                <div className={`rounded-2xl p-4 border mb-4 border-emerald-700/60 ${cardStyle}`}>
                  <h3 className="text-xs font-extrabold uppercase text-emerald-400 mb-2">
                    🛡️ Horas e Permissões Nov/2026 ({members.length} membros)
                  </h3>
                  <div className="space-y-2 text-xs">
                    {members.map((m) => {
                      const membroPioneiro = isPioneer(m);
                      const relatorioEntregue = (m.monthlyReports || []).find((r) => r.monthYear === MES_ATUAL);
                      const segMembro = (m.timeLogs || []).reduce((acc, l) => acc + l.durationSec, 0);
                      const horasMembro = relatorioEntregue
                        ? relatorioEntregue.totalHours
                        : +(18 + segMembro / 3600).toFixed(2);
                      const timerLiberado = canMemberUseTimer(m);
                      const myServiceLiberado = isElderOrDev(m) || myServiceUnlockedIds.includes(m.id);
                      const confirmandoRemocao = memberToDeleteId === m.id;

                      return (
                        <div key={m.id} className="p-2.5 rounded-lg bg-[#121A13]/40 space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <strong>{m.name}</strong>
                              <span className="block text-[10px] opacity-75">
                                {m.role.replace('_', ' ')}
                                {membroPioneiro && (
                                  <>
                                    {' '}• Total: <strong>{horasMembro}h</strong>
                                  </>
                                )}
                              </span>
                            </div>
                            {relatorioEntregue ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px] font-bold">
                                ✅ {membroPioneiro ? `${relatorioEntregue.totalHours}h • ` : ''}{relatorioEntregue.estudos} est.
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-yellow-950/70 text-yellow-300 border border-yellow-800 text-[10px]">
                                ⏳ Aguardando
                              </span>
                            )}
                          </div>

                          {podeGerirPermissoes && m.id !== currentUser.id && (
                            <>
                              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[#2F4231]">
                                {membroPioneiro && (
                                  <>
                                    <button
                                      onClick={() => alternarPermissaoMembro(m, 'canUseTimer')}
                                      className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                                        timerLiberado
                                          ? 'bg-emerald-900/70 text-emerald-200'
                                          : 'bg-red-950/80 text-red-300'
                                      }`}
                                    >
                                      {timerLiberado ? '⏱️ Cronômetro Liberado' : '🔒 Liberar Cronômetro'}
                                    </button>

                                    <button
                                      onClick={() => alternarMyServiceMembro(m.id)}
                                      className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                                        myServiceLiberado
                                          ? 'bg-emerald-900/70 text-emerald-200'
                                          : 'bg-[#233325] text-[#A5B8A3]'
                                      }`}
                                    >
                                      {myServiceLiberado ? '📅 My Service Liberado' : '🔒 Liberar My Service'}
                                    </button>
                                  </>
                                )}

                                <button
                                  onClick={() => alternarPermissaoMembro(m, 'canViewAllHours')}
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                                    m.canViewAllHours
                                      ? 'bg-emerald-900/70 text-emerald-200'
                                      : 'bg-[#233325] text-[#A5B8A3]'
                                  }`}
                                >
                                  {m.canViewAllHours ? '👁️ Vê Todas Horas' : '👁️‍🗨️ Só Próprias Horas'}
                                </button>

                                <button
                                  onClick={() => alternarPermissaoMembro(m, 'canAssignParts')}
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                                    m.canAssignParts
                                      ? 'bg-emerald-900/70 text-emerald-200'
                                      : 'bg-[#233325] text-[#A5B8A3]'
                                  }`}
                                >
                                  {m.canAssignParts ? '📋 Envia Designações' : '🚫 Não Envia Partes'}
                                </button>

                                <button
                                  onClick={() => {
                                    if (confirmandoRemocao) {
                                      setMemberToDeleteId(null);
                                      setDeletePassword('');
                                    } else {
                                      setMemberToDeleteId(m.id);
                                      setDeletePassword('');
                                    }
                                  }}
                                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-950/90 hover:bg-red-900 text-red-200 border border-red-800/70 cursor-pointer"
                                >
                                  {confirmandoRemocao ? '✕ Cancelar' : '🗑️ Remover'}
                                </button>
                              </div>

                              {confirmandoRemocao && (
                                <div className="p-2 rounded-lg bg-red-950/40 border border-red-800/70 space-y-1.5">
                                  <p className="text-[10px] text-red-200 font-semibold">
                                    🔑 Digite a senha de {currentUser.name} para remover <strong>{m.name}</strong>:
                                  </p>
                                  <div className="flex gap-1.5">
                                    <input
                                      type="password"
                                      placeholder="Sua senha (PIN)"
                                      value={deletePassword}
                                      onChange={(e) => setDeletePassword(e.target.value)}
                                      className="flex-1 px-2 py-1 rounded bg-[#121A13] border border-red-800 text-white text-[11px]"
                                    />
                                    <button
                                      disabled={deletingMember}
                                      onClick={() => confirmarRemocaoMembro(m)}
                                      className="px-2.5 py-1 rounded bg-red-700 hover:bg-red-600 text-white text-[10px] font-bold disabled:opacity-50 cursor-pointer"
                                    >
                                      {deletingMember ? '...' : 'Confirmar'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className={`rounded-2xl p-3.5 border mb-4 text-xs opacity-80 ${cardStyle}`}>
                  🔒 A visualização do total de horas de todos os membros é restrita a usuários autorizados.
                </div>
              )}

              {ehPioneiro && (
                <>
                  <h3 className="text-xs uppercase tracking-widest text-[#8FA38B] mb-2 font-bold">
                    Sessões Gravadas no PostgreSQL ({logsDoBanco.length})
                  </h3>
                  <div className="space-y-2">
                    {logsDoBanco.map((s) => (
                      <div key={s.id} className={`rounded-xl p-3 border flex justify-between items-center gap-2 text-xs ${cardStyle}`}>
                        <div>
                          <strong className="block">{s.date}</strong>
                          <span className="opacity-75">Duração: {formatTime(s.durationSec)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px]">
                            🗄️ Salvo no Neon DB
                          </span>
                          <button
                            type="button"
                            onClick={() => removerSessaoGravada(s.id)}
                            className="px-2 py-0.5 rounded bg-red-950/90 hover:bg-red-900 text-red-200 border border-red-800/70 text-[10px] font-bold cursor-pointer"
                          >
                            🗑️ Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <nav className="mt-6 bg-[#1A261C] border border-[#2F4231] rounded-2xl p-2.5 flex justify-around text-xs text-[#A5B8A3]">
          <button onClick={() => setActiveTab('inicio')} className={`flex flex-col items-center px-3 py-1 rounded-xl cursor-pointer ${activeTab === 'inicio' ? 'text-white font-bold bg-[#28382A]' : ''}`}>🏠<span>Início</span></button>
          <button onClick={() => setActiveTab('escalas')} className={`flex flex-col items-center px-3 py-1 rounded-xl cursor-pointer ${activeTab === 'escalas' ? 'text-white font-bold bg-[#28382A]' : ''}`}>📅<span>Programação</span></button>
          <button onClick={() => setActiveTab('territorios')} className={`flex flex-col items-center px-3 py-1 rounded-xl cursor-pointer ${activeTab === 'territorios' ? 'text-white font-bold bg-[#28382A]' : ''}`}>🗺️<span>Territórios</span></button>
          <button onClick={() => setActiveTab('relatorios')} className={`flex flex-col items-center px-3 py-1 rounded-xl cursor-pointer ${activeTab === 'relatorios' ? 'text-white font-bold bg-[#28382A]' : ''}`}>📊<span>Relatórios</span></button>
        </nav>
      </div>
    </div>
  );
}