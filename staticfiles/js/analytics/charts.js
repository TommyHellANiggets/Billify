/**
 * Скрипт для управления диаграммами на странице аналитики
 */
document.addEventListener('DOMContentLoaded', function() {
  // Настройка общих параметров для всех графиков
  Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.color = '#6c757d';
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  Chart.defaults.plugins.tooltip.titleFont = {size: 13, weight: 'bold'};
  Chart.defaults.plugins.tooltip.bodyFont = {size: 12};
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.padding = 15;
  
  // График доходов
  initRevenueChart();
  
  // Обработчики событий для переключения периодов
  initChartPeriodSwitchers();
});

/**
 * Инициализация графика доходов
 */
function initRevenueChart() {
  const revenueCtx = document.getElementById('revenueChart');
  if (!revenueCtx) return;
  
  const revenueData = JSON.parse(document.getElementById('revenue-data').textContent || '{}');
  const labels = revenueData.labels || [];
  const data = revenueData.data || [];
  
  window.revenueChart = new Chart(revenueCtx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Доходы (₽)',
        data: data,
        backgroundColor: 'rgba(107, 71, 237, 0.1)',
        borderColor: '#6b47ed',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#6b47ed',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += formatCurrency(context.parsed.y);
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCurrency(value, true);
            }
          }
        }
      }
    }
  });
}

/**
 * Инициализация обработчиков событий для переключения периодов графика доходов
 */
function initChartPeriodSwitchers() {
  const periodOptions = document.querySelectorAll('.chart-option');
  const periodData = JSON.parse(document.getElementById('period-data')?.textContent || '{}');
  
  periodOptions.forEach(option => {
    option.addEventListener('click', function() {
      const period = this.dataset.period;
      
      // Обновляем активный класс
      periodOptions.forEach(opt => opt.classList.remove('active'));
      this.classList.add('active');
      
      // Получаем данные для выбранного периода
      const data = periodData[period] || {};
      
      // Обновляем график доходов
      if (window.revenueChart) {
        window.revenueChart.data.labels = data.labels || [];
        window.revenueChart.data.datasets[0].data = data.data || [];
        window.revenueChart.update();
      }
    });
  });
}

/**
 * Форматирование валюты
 */
function formatCurrency(value, short = false) {
  if (value === null || value === undefined) return '';
  
  const formatter = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  const formatted = formatter.format(value);
  
  if (short && value >= 1000) {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + ' млн ₽';
    } else {
      return (value / 1000).toFixed(0) + ' тыс ₽';
    }
  }
  
  return formatted;
} 