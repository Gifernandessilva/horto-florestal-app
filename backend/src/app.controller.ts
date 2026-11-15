/* cspell:disable */
import { Controller, Get, Post, Body, Param, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Controller('api')
export class AppController implements OnModuleInit {
  // Ao iniciar o servidor, garante que a Congregação Horto Florestal e os membros iniciais existem no Neon!
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

      // Cria os membros iniciais na base de dados na nuvem
      await prisma.member.createMany({
        data: [
          { name: 'Taylyson', phone: '68999990001', pin: '1234', role: 'PIONEIRO_REGULAR', monthlyGoal: 50, serviceGroup: 'Grupo 1 - Horto', congregationId: cong.id },
          { name: 'Wdeyverson', phone: '68999990002', pin: '1234', role: 'ADMIN', monthlyGoal: 50, serviceGroup: 'Administração / Secretário', congregationId: cong.id },
          { name: 'Marcos Silva', phone: '68999990003', pin: '1234', role: 'PIONEIRO_AUXILIAR', monthlyGoal: 30, serviceGroup: 'Grupo 2 - Centro', congregationId: cong.id },
          { name: 'Ana Beatriz', phone: '68999990004', pin: '1234', role: 'PUBLICADOR', monthlyGoal: 0, serviceGroup: 'Grupo 1 - Horto', congregationId: cong.id },
        ],
      });

      // Cria os territórios iniciais no PostgreSQL
      await prisma.territory.createMany({
        data: [
          { id: 'T-01', nome: 'Quadra 01 • Arredores Parque do Horto', quadras: 4, status: 'Em andamento', responsavel: 'Taylyson', lat: -9.9482, lng: -67.8285, congregationId: cong.id },
          { id: 'T-02', nome: 'Quadra 02 • Av. Antônio da Rocha Viana', quadras: 6, status: 'Disponível', responsavel: 'Livre', lat: -9.9515, lng: -67.8240, congregationId: cong.id },
          { id: 'T-03', nome: 'Quadra 03 • Rua das Acácias', quadras: 5, status: 'Em andamento', responsavel: 'Marcos Silva', lat: -9.9530, lng: -67.8210, congregationId: cong.id },
        ],
      });
      console.log('✅ Dados iniciais da Congregação Horto Florestal criados no PostgreSQL!');
    }
  }

  // 1. Listar todos os membros da congregação (para Login e Painel do Secretário)
  @Get('members')
  async getMembers() {
    return prisma.member.findMany({
      include: { timeLogs: true, monthlyReports: true },
      orderBy: { name: 'asc' },
    });
  }

  // 2. Criar novo membro (quando mais pessoas entrarem no app)
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

  // 3. Sincronizar sessões do cronómetro (Offline -> PostgreSQL)
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

  // 4. Listar e assumir territórios em tempo real
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
}