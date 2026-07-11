export function formatCount(
  count: number,
  singular: string,
  plural = `${singular}s`,
) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatDate(value: string | null) {
  if (!value) {
    return 'No date';
  }

  const date = dateFromValue(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
  }).format(date);
}

export function formatDateRange(
  startDate: string | null,
  endDate: string | null,
) {
  if (startDate && endDate) {
    return `${formatDate(startDate)} to ${formatDate(endDate)}`;
  }

  if (startDate) {
    return formatDate(startDate);
  }

  if (endDate) {
    return formatDate(endDate);
  }

  return 'Date flexible';
}

function dateFromValue(value: string) {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!dateOnly) {
    return new Date(value);
  }

  const [, year, month, day] = dateOnly;

  return new Date(Number(year), Number(month) - 1, Number(day));
}
