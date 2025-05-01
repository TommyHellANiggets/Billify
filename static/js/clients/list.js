document.addEventListener('DOMContentLoaded', function() {
    // Заменяем эмодзи иконки на SVG
    replaceIcons();
    
    // Инициализация всплывающих подсказок при наведении
    initTooltips();
    
    // Анимация для кнопок действий
    const actionButtons = document.querySelectorAll('.btn-action');
    actionButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.btn-icon');
            icon.style.transform = 'scale(1.15)';
            icon.style.transition = 'transform 0.2s ease-in-out';
        });
        
        button.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.btn-icon');
            icon.style.transform = 'scale(1)';
        });
    });
    
    // Функция для замены эмодзи иконок на SVG
    function replaceIcons() {
        // Иконка поиска
        const searchIcon = document.querySelector('.search-icon');
        if (searchIcon) {
            searchIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#adb5bd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
        }
        
        // Иконки для действий
        const viewIcons = document.querySelectorAll('.btn-view .btn-icon');
        viewIcons.forEach(icon => {
            icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
        });
        
        const editIcons = document.querySelectorAll('.btn-edit .btn-icon');
        editIcons.forEach(icon => {
            icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`;
        });
        
        const deleteIcons = document.querySelectorAll('.btn-delete .btn-icon');
        deleteIcons.forEach(icon => {
            icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
        });
    }
    
    // Быстрые фильтры для типа клиентов/поставщиков
    const addQuickFilters = () => {
        const filterContainer = document.querySelector('.filters');
        if (!filterContainer) return;
        
        const quickFiltersDiv = document.createElement('div');
        quickFiltersDiv.className = 'quick-filters';
        quickFiltersDiv.innerHTML = `
            <div class="quick-filter-label">Быстрые фильтры:</div>
            <div class="quick-filter-buttons">
                <button type="button" data-entity="client" class="quick-filter-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    Только клиенты
                </button>
                <button type="button" data-entity="supplier" class="quick-filter-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    Только поставщики
                </button>
                <button type="button" data-type="individual" class="quick-filter-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    Физ. лица
                </button>
                <button type="button" data-type="business" class="quick-filter-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                    Юр. лица
                </button>
                <button type="button" data-reset="true" class="quick-filter-btn quick-filter-reset">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                    Сбросить все
                </button>
            </div>
        `;
        
        filterContainer.appendChild(quickFiltersDiv);
        
        // Добавляем обработчики для быстрых фильтров
        const quickFilterButtons = document.querySelectorAll('.quick-filter-btn');
        quickFilterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const entityType = this.getAttribute('data-entity');
                const clientType = this.getAttribute('data-type');
                const isReset = this.getAttribute('data-reset');
                
                const searchParams = new URLSearchParams(window.location.search);
                
                if (isReset) {
                    // Сбрасываем все фильтры
                    window.location.href = window.location.pathname;
                    return;
                }
                
                if (entityType) {
                    searchParams.set('entity_type', entityType);
                }
                
                if (clientType) {
                    searchParams.set('type', clientType);
                }
                
                // Сохраняем поисковый запрос, если он был
                const searchQuery = document.querySelector('input[name="search"]').value;
                if (searchQuery) {
                    searchParams.set('search', searchQuery);
                }
                
                window.location.href = `${window.location.pathname}?${searchParams.toString()}`;
            });
        });
    };
    
    // Инициализация всплывающих подсказок
    function initTooltips() {
        const tooltips = document.querySelectorAll('[title]');
        tooltips.forEach(tooltip => {
            tooltip.addEventListener('mouseenter', function() {
                const title = this.getAttribute('title');
                this.setAttribute('data-original-title', title);
                this.removeAttribute('title');
                
                const tooltipEl = document.createElement('div');
                tooltipEl.className = 'tooltip';
                tooltipEl.textContent = title;
                
                document.body.appendChild(tooltipEl);
                
                const rect = this.getBoundingClientRect();
                tooltipEl.style.top = rect.top - tooltipEl.offsetHeight - 10 + 'px';
                tooltipEl.style.left = rect.left + (rect.width / 2) - (tooltipEl.offsetWidth / 2) + 'px';
                
                setTimeout(() => {
                    tooltipEl.style.opacity = 1;
                    tooltipEl.style.transform = 'translateY(0)';
                }, 10);
                
                this.addEventListener('mouseleave', function tooltipLeave() {
                    tooltipEl.style.opacity = 0;
                    tooltipEl.style.transform = 'translateY(10px)';
                    
                    setTimeout(() => {
                        tooltipEl.remove();
                        this.setAttribute('title', this.getAttribute('data-original-title'));
                        this.removeAttribute('data-original-title');
                    }, 200);
                    
                    this.removeEventListener('mouseleave', tooltipLeave);
                });
            });
        });
    }
    
    // Добавляем стили для тултипов и быстрых фильтров динамически
    function addCustomStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .tooltip {
                position: fixed;
                background-color: #333;
                color: white;
                padding: 6px 10px;
                border-radius: 6px;
                font-size: 12px;
                z-index: 1000;
                opacity: 0;
                transform: translateY(10px);
                transition: opacity 0.2s, transform 0.2s;
            }
            
            .tooltip::after {
                content: '';
                position: absolute;
                bottom: -5px;
                left: 50%;
                margin-left: -5px;
                border-width: 5px 5px 0;
                border-style: solid;
                border-color: #333 transparent transparent transparent;
            }
            
            .quick-filters {
                margin-top: 1.2rem;
                padding-top: 1.2rem;
                border-top: 1px solid #edf2f7;
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 1rem;
            }
            
            .quick-filter-label {
                font-weight: 500;
                color: #6c757d;
                min-width: 120px;
                font-size: 14px;
            }
            
            .quick-filter-buttons {
                display: flex;
                flex-wrap: wrap;
                gap: 0.6rem;
            }
            
            .quick-filter-btn {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 12px;
                background-color: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 12px;
                cursor: pointer;
                font-size: 13px;
                transition: all 0.2s;
                color: #495057;
            }
            
            .quick-filter-btn:hover {
                background-color: #e9ecef;
                border-color: #ced4da;
                transform: translateY(-1px);
            }
            
            .quick-filter-reset {
                background-color: #fff5f5;
                border-color: #fee2e2;
                color: #e53e3e;
            }
            
            .quick-filter-reset:hover {
                background-color: #fee2e2;
                border-color: #fecaca;
            }
            
            @media (max-width: 768px) {
                .quick-filters {
                    flex-direction: column;
                    align-items: flex-start;
                }
                
                .quick-filter-buttons {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Добавляем стили и инициализируем быстрые фильтры
    addCustomStyles();
    addQuickFilters();
}); 