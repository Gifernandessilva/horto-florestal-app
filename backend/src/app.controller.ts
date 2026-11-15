/* cspell:disable */
import { Controller, Get, Post, Body, Param, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
          { name: 'Taylyson', phone: '68999990001', pin: '1234', role: 'PIONEIRO_REGULAR', monthlyGoal: 50, serviceGroup: 'Grupo 1 - Horto', congregationId: cong.id },
          { name: 'Wdeyverson', phone: '68999990002', pin: '1234', role: 'ADMIN', monthlyGoal: 50, serviceGroup: 'Administração / Secretário', congregationId: cong.id },
          { name: 'Marcos Silva', phone: '68999990003', pin: '1234', role: 'PIONEIRO_AUXILIAR', monthlyGoal: 30, serviceGroup: 'Grupo 2 - Centro', congregationId: cong.id },
          { name: 'Ana Beatriz', phone: '68999990004', pin: '1234', role: 'PUBLICADOR', monthlyGoal: 0, serviceGroup: 'Grupo 1 - Horto', congregationId: cong.id },
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
  }

  @Get()
  getStatus() {
    return { status: 'API Horto Florestal Online e Conectada ao PostgreSQL (Neon)!' };
  }

  // 1. Listar todos os membros (mapeando bibleStudies/returnVisits para o Frontend ler)
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

  // 2. Cadastrar novo membro
  @Post('members')
  async createMember(@Body() body: { name: string; phone: string; pin: string; role: string; monthlyGoal: number; serviceGroup: string }) {
    const cong = await prisma.congregation.findUnique({ where: { inviteCode: 'HORTO-2026' } });
    return prisma.member.create({
      data: {
        name: body.name,
        phone: body.phone,
        pin: body.pin || '1234',
        role: body.role || 'PUBLICADOR',
        monthlyGoal: Number(body.monthlyGoal) || 0,
        serviceGroup: body.serviceGroup || 'Grupo 1 - Horto',
        congregationId: cong!.id,
      },
    });
  }

  // 3. Sincronizar sessões do cronómetro
  @Post('timelogs/sync')
  async syncTimeLogs(@Body() body: { memberId: string; logs: any[] }) {
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

  // 4. Listar e atualizar territórios
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

  // 5. Listar todas as Escalas (Assignments)
  @Get('assignments')
  async getAssignments() {
    return prisma.assignment.findMany({
      include: { member: true },
      orderBy: { cargo: 'asc' },
    });
  }

  // 6. Criar nova Escala
  @Post('assignments')
  async createAssignment(@Body() body: { cargo: string; data: string; local?: string; memberId: string }) {
    return prisma.assignment.create({
      data: {
        cargo: body.cargo,
        data: body.data,
        local: body.local || 'Salão Principal',
        status: 'pendente',
        memberId: body.memberId,
      },
      include: { member: true },
    });
  }

  // 7. Confirmar presença na Escala
  @Post('assignments/:id/confirm')
  async confirmAssignment(@Param('id') id: string) {
    return prisma.assignment.update({
      where: { id },
      data: { status: 'confirmado' },
    });
  }

  // 8. Fechar e Enviar Relatório Mensal (usando os nomes exatos do schema.prisma)
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