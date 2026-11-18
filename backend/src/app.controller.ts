/* cspell:disable */
import { Controller, Get, Post, Put, Delete, Body, Param, Query, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function isPrivilegedRole(role?: string) {
  return role === 'ANCIAO' || role === 'DESENVOLVEDOR' || role === 'ADMIN';
}

@Controller('api')
export class AppController implements OnModuleInit {
  async onModuleInit() {
    let cong = await prisma.congregation.findUnique({
      where: { inviteCode: 'HORTO-2026' },
    });

    if (!cong) {
      cong = await prisma.congregation.create({
        data: {
          name: 'Horto Florestal',
          city: 'Rio Branco - AC',
          inviteCode: 'HORTO-2026',
        },
      });

      await prisma.member.createMany({
        data: [
          {
            name: 'Taylyson',
            phone: '68999990001',
            pin: '1234',
            role: 'PIONEIRO_REGULAR',
            monthlyGoal: 50,
            yearlyGoal: 600,
            canUseTimer: false,
            canViewAllHours: false,
            canAssignParts: false,
            serviceGroup: 'Grupo 1 - Horto',
            congregationId: cong.id,
          },
          {
            name: 'Wdeyverson',
            phone: '68999990002',
            pin: '1234',
            role: 'DESENVOLVEDOR',
            monthlyGoal: 50,
            yearlyGoal: 600,
            canUseTimer: true,
            canViewAllHours: true,
            canAssignParts: true,
            serviceGroup: 'Administração / Desenvolvedor',
            congregationId: cong.id,
          },
          {
            name: 'Marcos Silva',
            phone: '68999990003',
            pin: '1234',
            role: 'ANCIAO',
            monthlyGoal: 30,
            yearlyGoal: 360,
            canUseTimer: true,
            canViewAllHours: true,
            canAssignParts: true,
            serviceGroup: 'Corpo de Anciãos',
            congregationId: cong.id,
          },
          {
            name: 'Ana Beatriz',
            phone: '68999990004',
            pin: '1234',
            role: 'PUBLICADOR',
            monthlyGoal: 0,
            yearlyGoal: 0,
            canUseTimer: false,
            canViewAllHours: false,
            canAssignParts: false,
            serviceGroup: 'Grupo 1 - Horto',
            congregationId: cong.id,
          },
        ],
      });

      await prisma.territory.createMany({
        data: [
          { id: 'T-01', nome: 'Quadra 01 • Arredores Parque do Horto', quadras: 4, status: 'Em andamento', responsavel: 'Taylyson', lat: -9.9482, lng: -67.8285, congregationId: cong.id },
          { id: 'T-02', nome: 'Quadra 02 • Av. Antônio da Rocha Viana', quadras: 6, status: 'Disponível', responsavel: 'Livre', lat: -9.9515, lng: -67.8240, congregationId: cong.id },
          { id: 'T-03', nome: 'Quadra 03 • Rua das Acácias', quadras: 5, status: 'Em andamento', responsavel: 'Marcos Silva', lat: -9.9530, lng: -67.8210, congregationId: cong.id },
        ],
      });
    }

    const totalEscalas = await prisma.assignment.count();
    if (totalEscalas === 0) {
      const membros = await prisma.member.findMany();
      const taylyson = membros.find((m) => m.name === 'Taylyson') || membros[0];
      const wdeyverson = membros.find((m) => m.name === 'Wdeyverson') || membros[0];
      const marcos = membros.find((m) => m.name === 'Marcos Silva') || membros[0];

      if (taylyson && wdeyverson && marcos) {
        await prisma.assignment.createMany({
          data: [
            { cargo: 'Indicador de Entrada', data: 'Domingo, 15 Nov • 10:00', local: 'Salão Principal', status: 'pendente', memberId: taylyson.id },
            { cargo: 'Operador de Áudio e Vídeo', data: 'Quinta, 19 Nov • 19:30', local: 'Cabine de Som', status: 'confirmado', memberId: wdeyverson.id },
            { cargo: 'Microfone Volante', data: 'Domingo, 22 Nov • 10:00', local: 'Auditório', status: 'pendente', memberId: taylyson.id },
            { cargo: 'Leitor do Estudo', data: 'Domingo, 22 Nov • 10:40', local: 'Palco Principal', status: 'confirmado', memberId: marcos.id },
          ],
        });
      }
    }

    const totalReunioes = await prisma.midweekMeeting.count();
    if (totalReunioes === 0) {
      await prisma.midweekMeeting.create({
        data: {
          weekLabel: '16–22 de nov. de 2026',
          chairman: 'Taylisson Mesquita',
          openingPrayer: 'Taylisson Mesquita',
          closingPrayer: 'Wdeyverson M. de Freitas',
          partsJson: JSON.stringify([
            {
              section: 'Cabecalho',
              title: 'quarta-feira, 18 de novembro de 2026 • LAMENTAÇÕES 1-2',
              description: 'Cântico 28: Quem pode ser amigo de Jeová?',
              assignee: '',
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
              description: 'TESTEMUNHO INFORMAL. Comece uma conversa amigável com uma pessoa...',
              assignee: 'Camila Medeiros',
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
          ]),
        },
      });
    }

    const totalLimpezas = await prisma.cleaningSchedule.count();
    if (totalLimpezas === 0) {
      await prisma.cleaningSchedule.create({
        data: {
          weekLabel: 'Semana de 16/11 a 22/11',
          groupName: 'Grupo 1 - Horto',
          notes: 'Limpeza geral do auditório, banheiros e área externa após a reunião.',
        },
      });
    }
  }

  @Get()
  getStatus() {
    return { status: 'API Horto Florestal Online e Conectada ao PostgreSQL (Neon)!' };
  }

  @Get('members')
  async getMembers() {
    const members = await prisma.member.findMany({
      include: { timeLogs: true, monthlyReports: true, assignments: true },
      orderBy: { name: 'asc' },
    });

    return members.map((m) => ({
      ...m,
      monthlyReports: m.monthlyReports.map((r) => ({
        ...r,
        revisitas: r.returnVisits,
        estudos: r.bibleStudies,
        observacoes: r.notes || '',
        status: 'ENVIADO',
      })),
    }));
  }

  @Post('members')
  async createMember(
    @Body()
    body: {
      name: string;
      phone: string;
      pin: string;
      role: string;
      monthlyGoal: number;
      yearlyGoal?: number;
      serviceGroup: string;
    },
  ) {
    const cong = await prisma.congregation.findUnique({ where: { inviteCode: 'HORTO-2026' } });
    const privileged = isPrivilegedRole(body.role);
    const monthly = Number(body.monthlyGoal) || 0;
    const yearly = Number(body.yearlyGoal) || monthly * 12;

    return prisma.member.create({
      data: {
        name: body.name,
        phone: body.phone,
        pin: body.pin || '1234',
        role: body.role || 'PUBLICADOR',
        monthlyGoal: monthly,
        yearlyGoal: yearly,
        canUseTimer: privileged,
        canViewAllHours: privileged,
        canAssignParts: privileged,
        serviceGroup: body.serviceGroup || 'Grupo 1 - Horto',
        congregationId: cong!.id,
      },
    });
  }

  @Delete('members/:id')
  async deleteMember(
    @Param('id') id: string,
    @Query('actorId') actorId?: string,
    @Query('pin') pin?: string,
  ) {
    if (!actorId || !pin) {
      return { deleted: false, error: 'Informe o usuário e a senha para remover um membro.' };
    }

    const actor = await prisma.member.findUnique({ where: { id: actorId } });
    if (!actor || !isPrivilegedRole(actor.role)) {
      return { deleted: false, error: 'Apenas Anciãos ou Desenvolvedores podem remover membros.' };
    }

    if (actor.pin !== pin) {
      return { deleted: false, error: 'Senha incorreta. Remoção cancelada.' };
    }

    if (actor.id === id) {
      return { deleted: false, error: 'Você não pode remover o seu próprio usuário ativo.' };
    }

    const target = await prisma.member.findUnique({ where: { id } });
    if (!target) {
      return { deleted: false, error: 'Membro não encontrado.' };
    }

    await prisma.member.delete({ where: { id } });
    return { deleted: true, removedName: target.name };
  }

  @Post('members/:id/permissions')
  async updateMemberPermissions(
    @Param('id') id: string,
    @Body()
    body: {
      actorId?: string;
      canUseTimer?: boolean;
      canViewAllHours?: boolean;
      canAssignParts?: boolean;
    },
  ) {
    if (body.actorId) {
      const actor = await prisma.member.findUnique({ where: { id: body.actorId } });
      if (!actor || !isPrivilegedRole(actor.role)) {
        return { error: 'Apenas Anciãos ou Desenvolvedores podem alterar permissões.' };
      }
    }

    const current = await prisma.member.findUnique({ where: { id } });
    if (!current) return { error: 'Membro não encontrado.' };

    return prisma.member.update({
      where: { id },
      data: {
        canUseTimer: body.canUseTimer !== undefined ? Boolean(body.canUseTimer) : current.canUseTimer,
        canViewAllHours:
          body.canViewAllHours !== undefined ? Boolean(body.canViewAllHours) : current.canViewAllHours,
        canAssignParts:
          body.canAssignParts !== undefined ? Boolean(body.canAssignParts) : current.canAssignParts,
      },
    });
  }

  @Post('timelogs/sync')
  async syncTimeLogs(@Body() body: { memberId: string; logs: any[] }) {
    const member = await prisma.member.findUnique({ where: { id: body.memberId } });
    if (!member || (!member.canUseTimer && !isPrivilegedRole(member.role))) {
      return { synced: false, error: 'Cronômetro bloqueado para este membro.' };
    }

    for (const log of body.logs) {
      await prisma.timeLog.upsert({
        where: { id: log.id },
        update: {},
        create: {
          id: log.id,
          memberId: body.memberId,
          date: log.date,
          durationSec: log.durationSec,
          revisitas: log.revisitas || 0,
          estudos: log.estudos || 0,
        },
      });
    }
    return { synced: true };
  }

  @Delete('timelogs/:id')
  async deleteTimeLog(@Param('id') id: string) {
    const existing = await prisma.timeLog.findUnique({ where: { id } });
    if (!existing) {
      return { deleted: false, error: 'Sessão não encontrada.' };
    }

    await prisma.timeLog.delete({ where: { id } });
    return { deleted: true, id };
  }

  @Delete('timelogs/member/:memberId')
  async clearMemberTimeLogs(@Param('memberId') memberId: string) {
    const result = await prisma.timeLog.deleteMany({
      where: { memberId },
    });
    return { cleared: true, count: result.count };
  }

  @Get('territories')
  async getTerritories() {
    return prisma.territory.findMany({ orderBy: { id: 'asc' } });
  }

  @Post('territories/:id/assign')
  async assignTerritory(@Param('id') id: string, @Body() body: { responsavel: string; status: string }) {
    return prisma.territory.update({
      where: { id },
      data: { responsavel: body.responsavel, status: body.status },
    });
  }

  @Get('assignments')
  async getAssignments() {
    return prisma.assignment.findMany({
      include: { member: true },
      orderBy: { cargo: 'asc' },
    });
  }

  @Post('assignments')
  async createAssignment(
    @Body()
    body: {
      cargo: string;
      theme?: string;
      data: string;
      local?: string;
      memberId: string;
      actorId?: string;
    },
  ) {
    if (body.actorId) {
      const actor = await prisma.member.findUnique({ where: { id: body.actorId } });
      if (!actor || (!actor.canAssignParts && !isPrivilegedRole(actor.role))) {
        return { error: 'Sem permissão para criar ou enviar designações.' };
      }
    }

    const cargoFinal = body.theme?.trim()
      ? `${body.cargo.trim()} • Tema: ${body.theme.trim()}`
      : body.cargo.trim();

    return prisma.assignment.create({
      data: {
        cargo: cargoFinal,
        data: body.data,
        local: body.local || 'Salão Principal',
        status: 'pendente',
        memberId: body.memberId,
      },
      include: { member: true },
    });
  }

  @Delete('assignments/:id')
  async deleteAssignment(@Param('id') id: string) {
    const existing = await prisma.assignment.findUnique({ where: { id } });
    if (!existing) {
      return { deleted: false, error: 'Designação não encontrada.' };
    }

    await prisma.assignment.delete({ where: { id } });
    return { deleted: true, id };
  }

  @Post('assignments/:id/confirm')
  async confirmAssignment(@Param('id') id: string) {
    return prisma.assignment.update({
      where: { id },
      data: { status: 'confirmado' },
    });
  }

  @Get('midweek-meetings')
  async getMidweekMeetings() {
    return prisma.midweekMeeting.findMany({ orderBy: { createdAt: 'desc' } });
  }

  @Post('midweek-meetings')
  async createMidweekMeeting(
    @Body()
    body: {
      weekLabel: string;
      chairman: string;
      openingPrayer: string;
      closingPrayer: string;
      parts?: Array<{
        section: string;
        title: string;
        description?: string;
        assignee: string;
        assistant?: string;
      }>;
      actorId?: string;
    },
  ) {
    if (body.actorId) {
      const actor = await prisma.member.findUnique({ where: { id: body.actorId } });
      if (!actor || (!actor.canAssignParts && !isPrivilegedRole(actor.role))) {
        return { error: 'Sem permissão para cadastrar reunião do meio de semana.' };
      }
    }

    return prisma.midweekMeeting.create({
      data: {
        weekLabel: body.weekLabel,
        chairman: body.chairman,
        openingPrayer: body.openingPrayer,
        closingPrayer: body.closingPrayer,
        partsJson: JSON.stringify(body.parts || []),
      },
    });
  }

  @Put('midweek-meetings/:id')
  async updateMidweekMeeting(
    @Param('id') id: string,
    @Body()
    body: {
      weekLabel: string;
      chairman: string;
      openingPrayer: string;
      closingPrayer: string;
      parts?: Array<{
        section: string;
        title: string;
        description?: string;
        assignee: string;
        assistant?: string;
      }>;
      actorId?: string;
    },
  ) {
    if (body.actorId) {
      const actor = await prisma.member.findUnique({ where: { id: body.actorId } });
      if (!actor || (!actor.canAssignParts && !isPrivilegedRole(actor.role))) {
        return { error: 'Sem permissão para editar reunião do meio de semana.' };
      }
    }

    const existing = await prisma.midweekMeeting.findUnique({ where: { id } });
    if (!existing) {
      return { error: 'Programação não encontrada.' };
    }

    return prisma.midweekMeeting.update({
      where: { id },
      data: {
        weekLabel: body.weekLabel,
        chairman: body.chairman,
        openingPrayer: body.openingPrayer,
        closingPrayer: body.closingPrayer,
        partsJson: JSON.stringify(body.parts || []),
      },
    });
  }

  @Delete('midweek-meetings/:id')
  async deleteMidweekMeeting(@Param('id') id: string) {
    const existing = await prisma.midweekMeeting.findUnique({ where: { id } });
    if (!existing) return { deleted: false, error: 'Programação não encontrada.' };
    await prisma.midweekMeeting.delete({ where: { id } });
    return { deleted: true, id };
  }

  @Get('cleaning-schedules')
  async getCleaningSchedules() {
    return prisma.cleaningSchedule.findMany({ orderBy: { createdAt: 'desc' } });
  }

  @Post('cleaning-schedules')
  async createCleaningSchedule(
    @Body()
    body: {
      weekLabel: string;
      groupName: string;
      notes?: string;
      actorId?: string;
    },
  ) {
    if (body.actorId) {
      const actor = await prisma.member.findUnique({ where: { id: body.actorId } });
      if (!actor || (!actor.canAssignParts && !isPrivilegedRole(actor.role))) {
        return { error: 'Sem permissão para cadastrar escala de limpeza.' };
      }
    }

    return prisma.cleaningSchedule.create({
      data: {
        weekLabel: body.weekLabel,
        groupName: body.groupName,
        notes: body.notes || null,
      },
    });
  }

  @Delete('cleaning-schedules/:id')
  async deleteCleaningSchedule(@Param('id') id: string) {
    const existing = await prisma.cleaningSchedule.findUnique({ where: { id } });
    if (!existing) return { deleted: false, error: 'Escala de limpeza não encontrada.' };
    await prisma.cleaningSchedule.delete({ where: { id } });
    return { deleted: true, id };
  }

  @Post('reports/submit')
  async submitMonthlyReport(
    @Body()
    body: {
      memberId: string;
      monthYear: string;
      totalHours: number;
      revisitas: number;
      estudos: number;
      observacoes?: string;
    },
  ) {
    const existente = await prisma.monthlyReport.findFirst({
      where: {
        memberId: body.memberId,
        monthYear: body.monthYear,
      },
    });

    if (existente) {
      return prisma.monthlyReport.update({
        where: { id: existente.id },
        data: {
          totalHours: Number(body.totalHours),
          returnVisits: Number(body.revisitas) || 0,
          bibleStudies: Number(body.estudos) || 0,
          notes: body.observacoes || null,
        },
      });
    }

    return prisma.monthlyReport.create({
      data: {
        memberId: body.memberId,
        monthYear: body.monthYear,
        totalHours: Number(body.totalHours),
        returnVisits: Number(body.revisitas) || 0,
        bibleStudies: Number(body.estudos) || 0,
        notes: body.observacoes || null,
      },
    });
  }
}