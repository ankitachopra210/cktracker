const prisma = require('../config/db');

class AnalyticsService {
  async getExecutiveOverview() {
    const [
      totalCustomers,
      totalLeads,
      activeProjects,
      completedProjects,
      allPayments,
      allProjects,
      delayedStages,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.lead.count(),
      prisma.project.count({ where: { status: { in: ['PLANNING', 'IN_PROGRESS'] } } }),
      prisma.project.count({ where: { status: 'COMPLETED' } }),
      prisma.payment.findMany({ select: { amount: true, paymentStatus: true } }),
      prisma.project.findMany({ select: { budget: true, contractAmount: true } }),
      prisma.projectStage.count({ where: { status: 'DELAYED' } }),
    ]);

    const totalRevenueReceived = allPayments.reduce(
      (acc, p) => (p.paymentStatus === 'COMPLETED' ? acc + Number(p.amount) : acc),
      0
    );

    const totalPipelineValue = allProjects.reduce(
      (acc, p) => acc + Number(p.contractAmount || p.budget || 0),
      0
    );

    const averageProjectValue =
      allProjects.length > 0 ? Math.round(totalPipelineValue / allProjects.length) : 0;

    return {
      totalCustomers,
      totalLeads,
      activeProjects,
      completedProjects,
      totalRevenueReceived,
      totalPipelineValue,
      averageProjectValue,
      delayedStagesCount: delayedStages,
    };
  }

  async getMonthlyRevenue() {
    const payments = await prisma.payment.findMany({
      where: { paymentStatus: 'COMPLETED' },
      select: { amount: true, paymentDate: true },
      orderBy: { paymentDate: 'asc' },
    });

    const monthlyMap = {};
    payments.forEach((p) => {
      const monthKey = new Date(p.paymentDate).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
      monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + Number(p.amount);
    });

    return Object.entries(monthlyMap).map(([month, revenue]) => ({
      month,
      revenue,
    }));
  }

  async getStageDistribution() {
    const projects = await prisma.project.findMany({
      where: { status: { in: ['PLANNING', 'IN_PROGRESS'] } },
      select: { currentStageNumber: true },
    });

    const distribution = Array.from({ length: 14 }, (_, i) => ({
      stageNumber: i + 1,
      count: 0,
    }));

    projects.forEach((p) => {
      if (p.currentStageNumber >= 1 && p.currentStageNumber <= 14) {
        distribution[p.currentStageNumber - 1].count += 1;
      }
    });

    return distribution;
  }

  async getConversionFunnel() {
    const leads = await prisma.lead.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const funnel = [
      { stage: 'New Leads', count: 0 },
      { stage: 'Contacted', count: 0 },
      { stage: 'Site Surveys', count: 0 },
      { stage: 'Quotation Sent', count: 0 },
      { stage: 'Converted to Projects', count: 0 },
    ];

    leads.forEach((l) => {
      if (l.status === 'NEW') funnel[0].count += l._count.id;
      if (l.status === 'CONTACTED') funnel[1].count += l._count.id;
      if (l.status === 'SITE_VISIT_SCHEDULED') funnel[2].count += l._count.id;
      if (l.status === 'QUOTATION_SENT') funnel[3].count += l._count.id;
      if (l.status === 'CONVERTED') funnel[4].count += l._count.id;
    });

    return funnel;
  }

  async getBottlenecksAndDelays() {
    const delayed = await prisma.projectStage.findMany({
      where: { status: 'DELAYED' },
      include: {
        project: {
          select: { projectCode: true, title: true, customer: { select: { user: { select: { fullName: true } } } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return delayed;
  }
}

module.exports = new AnalyticsService();
