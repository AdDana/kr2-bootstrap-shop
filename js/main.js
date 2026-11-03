// ===== ВЫБОР ТОВАРА В МОДАЛЬНОМ ОКНЕ =====
const orderButtons = document.querySelectorAll('.product-card__button');
const modalProductSelect = document.getElementById('modal-product');

if (orderButtons.length > 0 && modalProductSelect) {
  orderButtons.forEach(button => {
    button.addEventListener('click', () => {
      const productName = button.dataset.product;
      if (productName) {
        Array.from(modalProductSelect.options).forEach(option => {
          if (option.value === productName || option.text === productName) {
            modalProductSelect.value = option.value;
          }
        });
      }
    });
  });
}

// ===== ОТПРАВКА ФОРМЫ В МОДАЛЬНОМ ОКНЕ =====
const orderForm = document.getElementById('order-form');
const successMessage = document.getElementById('success-message');

if (orderForm) {
  orderForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formElements = Array.from(orderForm.elements);

    formElements.forEach((element) => {
      if (element.willValidate) {
        element.removeAttribute('aria-invalid');
      }
    });

    if (!orderForm.checkValidity()) {
      formElements.forEach((element) => {
        if (element.willValidate && !element.checkValidity()) {
          element.setAttribute('aria-invalid', 'true');
        }
      });
      orderForm.reportValidity();
      return;
    }

    // Если всё ок:
    successMessage.hidden = false;
    orderForm.reset();

    const modalElement = document.getElementById('orderModal');
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
  });
}

// ===== ЗАГРУЗКА КУРСОВ ВАЛЮТ =====
let currentRates = { CNY: 12.5, JPY: 0.54 };

async function loadRates() {
  try {
    const res = await fetch('https://www.cbr-xml-daily.ru/daily_json.js');
    if (!res.ok) throw new Error('Ошибка загрузки курсов');
    const data = await res.json();
    
    currentRates = {
      CNY: data.Valute.CNY.Value,
      JPY: data.Valute.JPY.Value / 100
    };
    
    return currentRates;
  } catch (e) {
    console.error('Не удалось загрузить курсы:', e);
    return currentRates;
  }
}

// ===== ФИЛЬТР ПО ЦЕНЕ =====
const filterForm = document.getElementById('price-filter-form');

if (filterForm) {
  filterForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const from = parseFloat(document.getElementById('price-from').value) || 0;
    const to = parseFloat(document.getElementById('price-to').value) || Infinity;
    const targetCurrency = document.getElementById('price-currency').value;

    const cards = document.querySelectorAll('.row.g-4 > .col-12');
    
    cards.forEach(cardWrapper => {
      const priceBlock = cardWrapper.querySelector('[data-price]');
      if (!priceBlock) return;

      const basePrice = parseFloat(priceBlock.dataset.price);
      const baseCurrency = priceBlock.dataset.currency;
      
      let priceToCompare = basePrice;

      if (targetCurrency === 'RUB') {
        priceToCompare = basePrice * currentRates[baseCurrency];
      } else if (targetCurrency === 'CNY' && baseCurrency === 'JPY') {
        priceToCompare = (basePrice * currentRates.JPY) / currentRates.CNY;
      } else if (targetCurrency === 'JPY' && baseCurrency === 'CNY') {
        priceToCompare = (basePrice * currentRates.CNY) / currentRates.JPY;
      }

      priceToCompare = Math.round(priceToCompare);
      if (priceToCompare >= from && priceToCompare <= to) {
        cardWrapper.style.display = 'block';
      } else {
        cardWrapper.style.display = 'none';
      }
    });
  });
}

// ===== ФИЛЬТР ПО КАТЕГОРИЯМ =====
const filterButtons = document.querySelectorAll('#filter-buttons [data-filter]');
const productCards = document.querySelectorAll('.col-12.col-md-6.col-lg-4');

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    const filterValue = button.dataset.filter;

    productCards.forEach(card => {
      const categoryElement = card.querySelector('[data-category]');
      if (!categoryElement) return;

      const category = categoryElement.dataset.category;

      if (filterValue === 'all' || category === filterValue) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });

    const toastEl = document.getElementById('filterToast');
    if (toastEl) {
      const toast = new bootstrap.Toast(toastEl, { delay: 2000 });
      toast.show();
    }
  });
});

// ===== ПЕРЕСЧЕТ ЦЕН В РУБЛИ =====
async function updatePrices() {
  const rates = await loadRates();

  document.querySelectorAll('[data-price]').forEach(priceContainer => {
    const price = parseFloat(priceContainer.dataset.price);
    const currency = priceContainer.dataset.currency;
    const rate = rates[currency];

    if (rate) {
      const rub = Math.round(price * rate);
      const rubEl = priceContainer.querySelector('.product-card__price-rub');
      if (rubEl) {
        rubEl.textContent = ` (~${rub} ₽)`;
      }
    }
  });
}

updatePrices();