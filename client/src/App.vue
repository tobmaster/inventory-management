<template>
  <div
    class="app-shell"
    :class="{ rail: isRail, 'tier-tablet': isTablet, 'rail-open': railOpen, 'drawer-open': drawerOpen }"
  >
    <div
      v-if="drawerOpen || railOpen"
      class="scrim"
      :class="{ 'drawer-scrim': drawerOpen }"
      @click="drawerOpen ? closeDrawer() : closeRail()"
    ></div>

    <aside
      id="app-sidebar"
      ref="sidebarRef"
      class="sidebar"
      tabindex="-1"
      :aria-label="t('nav.companyName')"
      :role="isMobile && drawerOpen ? 'dialog' : null"
      :aria-modal="isMobile && drawerOpen ? 'true' : null"
      :inert="isMobile && !drawerOpen"
      @keydown.tab="trapTab"
    >
      <div class="sidebar-header">
        <div class="monogram" aria-hidden="true">CC</div>
        <div class="brand-text">
          <div class="brand-name">{{ t('nav.companyName') }}</div>
          <div class="brand-sub">{{ t('nav.subtitle') }}</div>
        </div>
        <button class="icon-btn drawer-close" :aria-label="t('nav.closeMenu')" @click="closeDrawer()">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path v-for="d in iconPaths('close')" :key="d" :d="d" />
          </svg>
        </button>
      </div>

      <nav class="sidebar-nav">
        <div v-for="group in navGroups" :key="group.id" class="nav-group">
          <div class="group-label">{{ t(group.labelKey) }}</div>
          <hr class="group-divider" />
          <router-link
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :exact-active-class="item.path === '/' ? 'is-active' : ''"
            :active-class="item.path === '/' ? '' : 'is-active'"
            :aria-label="isRail ? t(item.meta.titleKey) : null"
          >
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path v-for="d in iconPaths(item.meta.icon)" :key="d" :d="d" />
            </svg>
            <span class="nav-label">{{ t(item.meta.titleKey) }}</span>
            <span class="nav-tip" aria-hidden="true">{{ t(item.meta.titleKey) }}</span>
          </router-link>
        </div>
      </nav>

      <div class="sidebar-footer">
        <button
          class="nav-item footer-btn"
          :aria-pressed="soundEnabled ? 'true' : 'false'"
          :aria-label="t('nav.sounds')"
          @click="toggleSound()"
        >
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path v-for="d in iconPaths(soundEnabled ? 'speakerOn' : 'speakerOff')" :key="d" :d="d" />
          </svg>
          <span class="nav-label">{{ t('nav.sounds') }}</span>
          <span class="nav-tip" aria-hidden="true">{{ t('nav.sounds') }}</span>
        </button>
        <button
          ref="collapseBtnRef"
          class="nav-item footer-btn collapse-btn"
          :aria-label="expanded ? t('nav.collapse') : t('nav.expand')"
          :aria-expanded="expanded ? 'true' : 'false'"
          @click="toggleSidebar"
        >
          <svg class="icon chevron" :class="{ flipped: !expanded }" viewBox="0 0 24 24" aria-hidden="true">
            <path v-for="d in iconPaths('chevron')" :key="d" :d="d" />
          </svg>
          <span class="nav-label">{{ expanded ? t('nav.collapse') : t('nav.expand') }}</span>
          <span class="nav-tip" aria-hidden="true">{{ expanded ? t('nav.collapse') : t('nav.expand') }}</span>
        </button>
      </div>
    </aside>

    <div class="main">
      <header class="topbar">
        <button
          ref="menuBtnRef"
          class="icon-btn hamburger"
          aria-controls="app-sidebar"
          :aria-label="t('nav.openMenu')"
          :aria-expanded="drawerOpen ? 'true' : 'false'"
          @click="openDrawer"
        >
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path v-for="d in iconPaths('menu')" :key="d" :d="d" />
          </svg>
        </button>
        <nav class="breadcrumb" :aria-label="t('nav.breadcrumb')">
          <template v-if="groupLabelKey">
            <span class="crumb-group">{{ t(groupLabelKey) }}</span>
            <span class="crumb-sep" aria-hidden="true">/</span>
          </template>
          <span v-if="route.meta && route.meta.titleKey" class="crumb-page" aria-current="page">{{ t(route.meta.titleKey) }}</span>
        </nav>
        <div class="spacer"></div>
        <LanguageSwitcher />
        <ProfileMenu
          @show-profile-details="showProfileDetails = true"
          @show-tasks="showTasks = true"
        />
      </header>
      <FilterBar />
      <main class="content">
        <router-view />
      </main>
    </div>

    <ProfileDetailsModal
      :is-open="showProfileDetails"
      @close="showProfileDetails = false"
    />

    <TasksModal
      :is-open="showTasks"
      :tasks="tasks"
      @close="showTasks = false"
      @add-task="addTask"
      @delete-task="deleteTask"
      @toggle-task="toggleTask"
    />
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from './api'
import { useAuth } from './composables/useAuth'
import { useI18n } from './composables/useI18n'
import { useSound } from './composables/useSound'
import FilterBar from './components/FilterBar.vue'
import ProfileMenu from './components/ProfileMenu.vue'
import ProfileDetailsModal from './components/ProfileDetailsModal.vue'
import TasksModal from './components/TasksModal.vue'
import LanguageSwitcher from './components/LanguageSwitcher.vue'

export default {
  name: 'App',
  components: {
    FilterBar,
    ProfileMenu,
    ProfileDetailsModal,
    TasksModal,
    LanguageSwitcher
  },
  setup() {
    const { currentUser } = useAuth()
    const { t } = useI18n()
    const { enabled: soundEnabled, play, toggle: toggleSound } = useSound()
    const route = useRoute()
    const router = useRouter()
    const showProfileDetails = ref(false)
    const showTasks = ref(false)
    const apiTasks = ref([])

    // Merge mock tasks from currentUser with API tasks
    const tasks = computed(() => {
      return [...currentUser.value.tasks, ...apiTasks.value]
    })

    const loadTasks = async () => {
      try {
        apiTasks.value = await api.getTasks()
      } catch (err) {
        console.error('Failed to load tasks:', err)
      }
    }

    const addTask = async (taskData) => {
      try {
        const newTask = await api.createTask(taskData)
        // Add new task to the beginning of the array
        apiTasks.value.unshift(newTask)
        play('success')
      } catch (err) {
        play('error')
        console.error('Failed to add task:', err)
      }
    }

    const deleteTask = async (taskId) => {
      try {
        // Check if it's a mock task (from currentUser)
        const isMockTask = currentUser.value.tasks.some(t => t.id === taskId)

        if (isMockTask) {
          // Remove from mock tasks
          const index = currentUser.value.tasks.findIndex(t => t.id === taskId)
          if (index !== -1) {
            currentUser.value.tasks.splice(index, 1)
          }
        } else {
          // Remove from API tasks
          await api.deleteTask(taskId)
          apiTasks.value = apiTasks.value.filter(t => t.id !== taskId)
        }
        play('success')
      } catch (err) {
        play('error')
        console.error('Failed to delete task:', err)
      }
    }

    const toggleTask = async (taskId) => {
      try {
        // Check if it's a mock task (from currentUser)
        const mockTask = currentUser.value.tasks.find(t => t.id === taskId)

        if (mockTask) {
          // Toggle mock task status
          mockTask.status = mockTask.status === 'pending' ? 'completed' : 'pending'
        } else {
          // Toggle API task
          const updatedTask = await api.toggleTask(taskId)
          const index = apiTasks.value.findIndex(t => t.id === taskId)
          if (index !== -1) {
            apiTasks.value[index] = updatedTask
          }
        }
        play('success')
      } catch (err) {
        play('error')
        console.error('Failed to toggle task:', err)
      }
    }


    // ---- Shell state ----
    const ICONS = {
      grid: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h6v6h-6z'],
      box: ['M21 8l-9-5-9 5v8l9 5 9-5z', 'M3 8l9 5 9-5', 'M12 13v8'],
      clipboard: ['M9 4h6v3H9z', 'M15 5h2a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h2', 'M9 12h6', 'M9 16h6'],
      trend: ['M3 17l6-6 4 4 8-8', 'M15 7h6v6'],
      wallet: ['M3 7a2 2 0 012-2h13v4', 'M3 7v11a2 2 0 002 2h15a1 1 0 001-1V9a1 1 0 00-1-1H5a2 2 0 01-2-1z', 'M16 14h2'],
      chart: ['M4 20V10', 'M10 20V4', 'M16 20v-7', 'M22 20H2'],
      chevron: ['M15 6l-6 6 6 6'],
      menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
      close: ['M6 6l12 12', 'M18 6L6 18'],
      speakerOn: ['M4 9v6h4l5 4V5L8 9z', 'M16.5 9a4 4 0 010 6', 'M19 6.5a8 8 0 010 11'],
      speakerOff: ['M4 9v6h4l5 4V5L8 9z', 'M17 9l5 6', 'M22 9l-5 6']
    }
    const iconPaths = (name) => ICONS[name] || []

    const GROUPS = [
      { id: 'operations', labelKey: 'nav.groupOperations' },
      { id: 'finance', labelKey: 'nav.groupFinance' }
    ]
    // Nav is built from route meta so main.js stays the single source of truth
    const navGroups = computed(() =>
      GROUPS.map(g => ({
        ...g,
        items: router.getRoutes().filter(r => r.meta && r.meta.group === g.id)
      })).filter(g => g.items.length)
    )
    const groupLabelKey = computed(() => {
      const g = GROUPS.find(x => x.id === (route.meta && route.meta.group))
      return g ? g.labelKey : null
    })

    const readCollapsed = () => {
      try { return localStorage.getItem('sidebar-collapsed') === '1' } catch (e) { return false }
    }
    const collapsed = ref(readCollapsed())
    const toggleCollapsed = () => {
      collapsed.value = !collapsed.value
      try { localStorage.setItem('sidebar-collapsed', collapsed.value ? '1' : '0') } catch (e) { /* storage unavailable */ }
    }

    // Three tiers: phone (<768) off-canvas drawer, tablet (768-1279) auto icon rail with overlay expand, desktop manual collapse
    const mqMobile = window.matchMedia('(max-width: 767px)')
    const mqTablet = window.matchMedia('(min-width: 768px) and (max-width: 1279px)')
    const isMobile = ref(mqMobile.matches)
    const isTablet = ref(mqTablet.matches)

    const drawerOpen = ref(false)
    const railOpen = ref(false)
    const sidebarRef = ref(null)
    const menuBtnRef = ref(null)
    const collapseBtnRef = ref(null)

    // Tablet ignores the stored preference (without overwriting it); the overlay temporarily shows the full sidebar
    const isRail = computed(() => {
      if (isMobile.value) return false
      if (isTablet.value) return !railOpen.value
      return collapsed.value
    })
    const expanded = computed(() => (isTablet.value ? railOpen.value : !collapsed.value))

    const openDrawer = async () => {
      drawerOpen.value = true
      play('open')
      await nextTick()
      // Move focus into the drawer so keyboard users land inside it
      if (sidebarRef.value) sidebarRef.value.focus()
    }
    const closeDrawer = async (returnFocus = true) => {
      if (!drawerOpen.value) return
      drawerOpen.value = false
      play('close')
      await nextTick()
      if (returnFocus && menuBtnRef.value) menuBtnRef.value.focus()
    }
    const closeRail = async (returnFocus = false) => {
      if (!railOpen.value) return
      railOpen.value = false
      play('close')
      await nextTick()
      if (returnFocus && collapseBtnRef.value) collapseBtnRef.value.focus()
    }
    const toggleSidebar = () => {
      if (!isTablet.value) return toggleCollapsed()
      if (railOpen.value) closeRail()
      else {
        railOpen.value = true
        play('open')
      }
    }
    const onKeydown = (e) => {
      if (e.key !== 'Escape') return
      closeDrawer()
      closeRail(true)
    }
    const trapTab = (e) => {
      if (!isMobile.value || !drawerOpen.value || !sidebarRef.value) return
      const focusable = [...sidebarRef.value.querySelectorAll('a[href], button:not([disabled])')]
        .filter(el => el.offsetParent !== null)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      // The aside itself (tabindex -1) holds focus on open, so treat it as "before first"
      if (e.shiftKey && (active === first || active === sidebarRef.value)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    const onMqChange = () => {
      isMobile.value = mqMobile.matches
      isTablet.value = mqTablet.matches
      // Silent close so overlays don't reappear after a later resize
      if (!isMobile.value) drawerOpen.value = false
      if (!isTablet.value) railOpen.value = false
    }
    // Navigating closes overlays; focus follows the new page, not the trigger
    watch(() => route.fullPath, () => {
      closeDrawer(false)
      closeRail(false)
    })
    onMounted(() => {
      window.addEventListener('keydown', onKeydown)
      mqMobile.addEventListener('change', onMqChange)
      mqTablet.addEventListener('change', onMqChange)
    })
    onBeforeUnmount(() => {
      window.removeEventListener('keydown', onKeydown)
      mqMobile.removeEventListener('change', onMqChange)
      mqTablet.removeEventListener('change', onMqChange)
    })

    onMounted(loadTasks)

    return {
      t,
      showProfileDetails,
      showTasks,
      tasks,
      addTask,
      deleteTask,
      toggleTask,
      soundEnabled,
      toggleSound,
      iconPaths,
      navGroups,
      groupLabelKey,
      route,
      isRail,
      isTablet,
      expanded,
      railOpen,
      toggleSidebar,
      closeRail,
      collapseBtnRef,
      drawerOpen,
      isMobile,
      trapTab,
      sidebarRef,
      menuBtnRef,
      openDrawer,
      closeDrawer
    }
  }
}
</script>

<style scoped>
.app-shell {
  display: grid;
  grid-template-columns: var(--sidebar-w) minmax(0, 1fr);
  min-height: 100vh;
  transition: grid-template-columns var(--dur-slow) var(--ease);
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-right: 1px solid var(--border);
  overflow: hidden;
  z-index: 200;
}
.sidebar:focus { outline: none; }

.sidebar-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: var(--topbar-h);
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.monogram {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--brand);
  color: var(--on-brand);
  border-radius: var(--radius-md);
  font-weight: 700;
  font-size: var(--text-sm);
  letter-spacing: 0.02em;
}
.brand-text { min-width: 0; flex: 1; }
.brand-name {
  font-weight: 600;
  font-size: var(--text-base);
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.brand-sub {
  font-size: var(--text-xs);
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4) var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.nav-group { display: flex; flex-direction: column; gap: var(--space-1); }
.group-label {
  padding: 0 var(--space-3) var(--space-1);
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
}
.group-divider { display: none; border: 0; border-top: 1px solid var(--border); margin: var(--space-1) 0; }

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 40px;
  padding: 0 var(--space-3);
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: var(--text-base);
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
}
.nav-item:hover { background: var(--gray-10); }
.nav-item:focus-visible, .icon-btn:focus-visible { outline: none; box-shadow: var(--focus-ring); }
.nav-item.is-active { color: var(--brand); background: var(--gray-10); }
.nav-item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--brand);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}
.footer-btn[aria-pressed='false'] { color: var(--text-muted); }

.icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.chevron { transition: transform var(--dur-base) var(--ease); }
.chevron.flipped { transform: rotate(180deg); }
.nav-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.sidebar-footer {
  padding: var(--space-3);
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex-shrink: 0;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text);
  cursor: pointer;
}
.icon-btn:hover { background: var(--gray-10); }
.drawer-close, .hamburger { display: none; }

.main { min-width: 0; display: flex; flex-direction: column; }

.topbar {
  position: sticky;
  top: 0;
  z-index: 150;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: var(--topbar-h);
  padding: 0 var(--space-8);
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}
.spacer { flex: 1; }
.breadcrumb { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-base); min-width: 0; }
.crumb-group { color: var(--text-muted); }
.crumb-sep { color: var(--text-muted); }
.crumb-page { color: var(--text); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.content {
  flex: 1;
  width: 100%;
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-8);
}

.scrim { position: fixed; inset: 0; z-index: 190; }
.drawer-scrim { background: var(--scrim); }

.nav-tip {
  display: none;
  position: absolute;
  left: calc(100% + var(--space-2));
  top: 50%;
  transform: translateY(-50%);
  padding: var(--space-1) var(--space-2);
  background: var(--text);
  color: var(--on-brand);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  z-index: 300;
}
@keyframes tip-in { from { opacity: 0; } to { opacity: 1; } }

/* Icons-only rail: set from script (manual collapse on desktop, automatic on tablet) */
.app-shell.rail { grid-template-columns: var(--sidebar-w-collapsed) minmax(0, 1fr); }
/* Overflow stays visible so tooltips can extend past the 72px rail */
.rail .sidebar,
.rail .sidebar-nav { overflow: visible; }
.rail .brand-text,
.rail .nav-label,
.rail .group-label { display: none; }
.rail .group-divider { display: block; }
.rail .sidebar-header { justify-content: center; padding: 0; }
.rail .nav-item { justify-content: center; padding: 0; }
.rail .nav-item:hover .nav-tip,
.rail .nav-item:focus-visible .nav-tip {
  display: block;
  animation: tip-in var(--dur-fast) var(--ease) 300ms both;
}

/* Tablet: content column stays 72px wide; expanding overlays the sidebar instead of reflowing */
@media (min-width: 768px) and (max-width: 1279px) {
  .app-shell.tier-tablet {
    grid-template-columns: minmax(0, 1fr);
    padding-left: var(--sidebar-w-collapsed);
  }
  .tier-tablet .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: var(--sidebar-w-collapsed);
  }
  .tier-tablet.rail-open .sidebar { width: var(--sidebar-w); box-shadow: var(--shadow-lg); }
}

@media (max-width: 767px) {
  .app-shell { grid-template-columns: minmax(0, 1fr); }
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: var(--sidebar-w);
    max-width: 85vw;
    transform: translateX(-100%);
    transition: transform var(--dur-slow) var(--ease);
    box-shadow: none;
  }
  .drawer-open .sidebar { transform: translateX(0); box-shadow: var(--shadow-lg); }
  .hamburger, .drawer-close { display: inline-flex; }
  .collapse-btn { display: none; }
  .topbar { padding: 0 var(--space-4); gap: var(--space-2); }
  .content { padding: var(--space-4); }
}

@media (prefers-reduced-motion: reduce) {
  .app-shell, .sidebar, .chevron { transition: none; }
}
</style>
