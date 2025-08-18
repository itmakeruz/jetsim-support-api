import { Operators, Tickets } from '@prisma/client';
import { categories } from '../../dto/categories';
import { ticket_id } from 'src/message-hendler/socket-validator-pipe/schema';

interface IReportData {
  tickets: Tickets[];
  first_name: string;
  last_name: string;
  id: number;
}

function fillOperatorData(tickets: Tickets[]) {
  const allCategories = categories.map((item) => item.slug);
  const result = allCategories.reduce(
    (acc, item) => {
      return {
        ...acc,
        [item]: 0,
      };
    },
    {
      overall: 0,
    },
  );

  if (!tickets || !tickets.length) return result;

  tickets.forEach((ticket) => {
    const ticketStatus = ticket.status;
    if (result.hasOwnProperty(ticketStatus)) {
      result[ticketStatus]++;
    }
  });

  result['overall'] = Object.keys(result).reduce(
    (acc, curr) => result[curr] + acc,
    0,
  );

  return result;
}

function returnUserFullName(user: Partial<Operators>) {
  return `${user.first_name ?? 'Не найдено'}`;
}

function modifyHeadersByCategory(data: IReportData[]) {
  const result = categories.map((category) => {
    let count = 0;

    for (let i = 0; i < data.length; i++) {
      const currentItem = data[i];

      if (!currentItem.tickets.length) continue;

      for (let j = 0; j < currentItem.tickets.length; j++) {
        const currentTicket = currentItem.tickets[j];
        if (currentTicket.status === category.slug) count++;
      }
    }

    return {
      ...category,
      name: count > 0 ? category.name + ` (${count})` : category.name,
    };
  });

  return [
    ...result,
    {
      name: 'Всего',
      slug: 'overall',
    },
  ];
}

export function reportAdapter(data: IReportData[]) {
  if (!Array.isArray(data)) return [];

  return {
    headers: modifyHeadersByCategory(data),
    data: data.map((item) => {
      return {
        id: item.id,
        fullName: returnUserFullName(item),
        ...fillOperatorData(item.tickets),
      };
    }),
  };
}
