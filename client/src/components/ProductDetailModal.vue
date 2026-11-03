<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen && product" class="modal-overlay" @click="close">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">Product Details</h3>
            <button class="close-button" :aria-label="t('common.close')" @click="close">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="product-header">
              <div class="product-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <rect x="8" y="12" width="32" height="28" rx="2" stroke="currentColor" stroke-width="2.5"/>
                  <path d="M16 8V16M32 8V16M8 20H40" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="product-title-section">
                <h4 class="product-name">{{ product.name }}</h4>
                <div class="product-sku">SKU: {{ product.sku }}</div>
              </div>
              <span class="stock-badge" :class="getStockBadgeClass(product.stockLevel)">
                {{ product.stockLevel }}
              </span>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Category</div>
                <div class="info-value">{{ product.category }}</div>
              </div>

              <div class="info-item">
                <div class="info-label">Warehouse</div>
                <div class="info-value">{{ product.warehouse }}</div>
              </div>

              <div class="info-item">
                <div class="info-label">Units Ordered</div>
                <div class="info-value">{{ product.unitsOrdered }}</div>
              </div>

              <div class="info-item">
                <div class="info-label">Total Revenue</div>
                <div class="info-value">{{ currencySymbol }}{{ product.revenue.toLocaleString() }}</div>
              </div>

              <div class="info-item">
                <div class="info-label">Current Stock</div>
                <div class="info-value">{{ product.quantityOnHand }} units</div>
              </div>

              <div class="info-item">
                <div class="info-label">Reorder Point</div>
                <div class="info-value">{{ product.reorderPoint }} units</div>
              </div>

              <div class="info-item">
                <div class="info-label">First Order Date</div>
                <div class="info-value">{{ formatDate(product.firstOrderDate) }}</div>
              </div>

              <div class="info-item">
                <div class="info-label">Stock Status</div>
                <div class="info-value">
                  <span :class="['badge', getStockBadgeClass(product.stockLevel)]">
                    {{ product.stockLevel }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="close">Close</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useSound } from '../composables/useSound'

const { t, currentCurrency } = useI18n()

const currencySymbol = computed(() => {
  return currentCurrency.value === 'JPY' ? '¥' : '$'
})

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  product: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const { play } = useSound()
// Audible cue on visibility change only (not on mount), so the modal feels responsive without playing at app start
watch(() => props.isOpen, (open) => play(open ? 'open' : 'close'))

const close = () => {
  emit('close')
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getStockBadgeClass = (stockLevel) => {
  if (stockLevel === 'In Stock') return 'success'
  if (stockLevel === 'Low Stock') return 'warning'
  if (stockLevel === 'Out of Stock') return 'danger'
  return 'info'
}
</script>

<style scoped>
.modal-container { max-width: 680px; }

.product-header {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--border);
  margin-bottom: var(--space-6);
}

.product-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--on-brand);
  flex-shrink: 0;
}

.product-title-section {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--text);
  margin: 0 0 var(--space-1) 0;
}

.product-sku {
  font-size: var(--text-base);
  color: var(--text-muted);
  font-family: ui-monospace, Menlo, Consolas, monospace;
}

.product-icon { background: var(--brand); }

.stock-badge {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pill);
  font-size: var(--text-sm);
  font-weight: 600;
  flex-shrink: 0;
}

.stock-badge.success { background: var(--status-success-bg); color: var(--status-success-fg); }
.stock-badge.warning { background: var(--status-warning-bg); color: var(--status-warning-fg); }
.stock-badge.danger { background: var(--status-danger-bg); color: var(--status-danger-fg); }

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-5) var(--space-6);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.info-label {
  font-size: var(--text-sm);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.info-value {
  font-size: var(--text-md);
  color: var(--text);
  font-weight: 500;
}
</style>
