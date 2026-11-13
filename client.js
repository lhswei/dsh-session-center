/**
 * Session Hub — client half.
 *
 * Registers a global sidebar panel through the shell's own seats, exactly like
 * the shipped Plugins / Schedule pages and the task-board plugin do:
 *   - one row in `sidebar.panellist` (the rail icon + label),
 *   - one keyed page in the layout's `main` slot.
 *
 * The page shows three sections driven by the client session/workspaces
 * catalogs (no polling, no Host RPC):
 *   1. 工作目录 — every workspace with a one-click "new session" action,
 *   2. 进行中   — running top-level sessions (subagents excluded),
 *   3. 最近     — most recent non-blank sessions.
 *
 * Actions go through ctx.uiWorkspace when present (the official navigation
 * face), with a sessions.retain + layout.selectPanel fallback.
 */
window.__ModuleLoader__.load({
  id: '@local/session-hub',
  factory(require) {
    const React = require('react')

    const NS = 'session-hub'
    const PANEL_ID = 'session-hub'
    // Rail order: Plugins=0, Schedule=10, task-board=20 → this lands after them.
    const PANEL_ORDER = 30

    // ---------------------------------------------------------------- locale

    const ZH = {
      'panel.label': '会话中心',
      'section.workspaces': '工作目录',
      'section.running': '进行中',
      'section.recent': '最近',
      'action.newSession': '新会话',
      'action.openWorkspace': '打开目录',
      'status.running': '运行中',
      'status.waitingApproval': '等待批准',
      'status.planReview': '计划待审',
      'status.waitingAnswer': '等待回答',
      'session.untitled': '未命名会话',
      'badge.current': '当前',
      'action.openSession': '打开会话',
      'empty.workspaces': '暂无工作目录',
      'empty.running': '没有进行中的会话',
      'empty.recent': '还没有会话',
      'ws.sessions': '{count} 个会话',
    }
    const EN = {
      'panel.label': 'Session hub',
      'section.workspaces': 'Workspaces',
      'section.running': 'Running',
      'section.recent': 'Recent',
      'action.newSession': 'New session',
      'action.openWorkspace': 'Open workspace',
      'status.running': 'Running',
      'status.waitingApproval': 'Waiting for approval',
      'status.planReview': 'Plan under review',
      'status.waitingAnswer': 'Waiting for reply',
      'session.untitled': 'Untitled session',
      'badge.current': 'Current',
      'action.openSession': 'Open session',
      'empty.workspaces': 'No workspaces yet',
      'empty.running': 'Nothing running',
      'empty.recent': 'No sessions yet',
      'ws.sessions': '{count} sessions',
    }

    // ---------------------------------------------------------------- styles

    const CSS = [
      '.shub-panel{height:100%;overflow:hidden;box-sizing:border-box;padding:14px 16px 16px;color:var(--dsw-alias-label-primary,inherit);font-size:13px;line-height:1.45;display:flex;flex-direction:column;}',
      '.shub-inner{flex:1 1 auto;min-height:0;display:flex;gap:18px;align-items:stretch;width:100%;max-width:1100px;margin:0 auto;}',
      '.shub-section{flex:1 1 0;min-width:0;display:flex;flex-direction:column;min-height:0;}',
      '.shub-section-title{flex:none;display:flex;align-items:center;gap:6px;margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:.02em;color:var(--dsw-alias-label-secondary,var(--dsw-alias-label-primary,inherit));opacity:.85;}',
      '.shub-section-body{flex:1 1 auto;min-height:0;overflow-y:auto;padding:2px 2px 8px;}',
      '@media (max-width:720px){.shub-inner{flex-direction:column;overflow-y:auto;}.shub-section-body{overflow:visible;flex:none;}}',
      '.shub-count{font-weight:400;opacity:.7;}',
      '.shub-empty{padding:6px 10px;color:var(--dsw-alias-label-secondary,var(--dsw-alias-label-primary,inherit));opacity:.7;font-size:12px;}',
      '.shub-row{display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;padding:6px 10px;border-radius:var(--dsw-radius-sm,6px);}',
      '.shub-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.14));}',
      '.shub-row.active{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.14));}',
      '.shub-row.active .shub-title{font-weight:600;}',
      '.shub-row-main{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:1px;}',
      '.shub-row-top{display:flex;align-items:center;gap:8px;min-width:0;}',
      '.shub-dot{flex:none;width:8px;height:8px;border-radius:50%;background:rgba(127,127,127,.35);}',
      '.shub-title{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.shub-row-sub{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--dsw-alias-label-secondary,var(--dsw-alias-label-primary,inherit));opacity:.75;}',
      '.shub-time{flex:none;font-size:11px;color:var(--dsw-alias-label-secondary,var(--dsw-alias-label-primary,inherit));opacity:.8;}',
      '.shub-badge{flex:none;padding:1px 6px;border-radius:4px;background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.14));font-size:10px;color:var(--dsw-alias-label-secondary,var(--dsw-alias-label-primary,inherit));}',
      '.shub-ws-row{display:flex;align-items:center;gap:8px;padding:5px 10px;border-radius:var(--dsw-radius-sm,6px);}',
      '.shub-ws-main{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:1px;}',
      '.shub-ws-top{display:flex;align-items:center;gap:8px;min-width:0;}',
      '.shub-ws-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.14));}',
      '.shub-ws-title{flex:0 1 auto;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border:none;background:transparent;padding:0;color:inherit;font:inherit;cursor:pointer;font-weight:500;}',
      '.shub-ws-path{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--dsw-alias-label-secondary,var(--dsw-alias-label-primary,inherit));opacity:.75;}',
      '.shub-ws-count{flex:none;font-size:11px;color:var(--dsw-alias-label-secondary,var(--dsw-alias-label-primary,inherit));opacity:.65;}',
      '.shub-new-btn{flex:none;padding:2px 10px;border:1px solid var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.3));border-radius:999px;background:transparent;color:inherit;font:inherit;font-size:12px;cursor:pointer;white-space:nowrap;}',
      '.shub-new-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.14));}',
      '.shub-loading{padding:8px 10px;color:var(--dsw-alias-label-secondary,var(--dsw-alias-label-primary,inherit));opacity:.7;font-size:12px;}',
    ].join('\n')

    // ---------------------------------------------------------------- helpers

    const STATUS_COLORS = {
      running: '#22c55e',
      approval: '#f59e0b',
      planReview: '#8b5cf6',
      answer: '#38bdf8',
    }

    function statusOf(row) {
      const s = String((row && row.formatStatus) || '')
      if (s.indexOf('approval') >= 0) return 'approval'
      if (s.indexOf('plan') >= 0) return 'planReview'
      if (s.indexOf('answer') >= 0) return 'answer'
      if (row && row.running) return 'running'
      return ''
    }

    function statusLabel(kind, t) {
      if (kind === 'approval') return t('status.waitingApproval')
      if (kind === 'planReview') return t('status.planReview')
      if (kind === 'answer') return t('status.waitingAnswer')
      if (kind === 'running') return t('status.running')
      return ''
    }

    function normPath(p) {
      return String(p || '').replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase()
    }

    function basename(p) {
      const parts = String(p || '').split(/[\\/]/).filter(Boolean)
      return parts.length ? parts[parts.length - 1] : ''
    }

    function toIds(value) {
      if (!value) return []
      if (Array.isArray(value)) return value
      if (typeof value === 'object') return Array.from(value)
      return []
    }

    function byUpdatedDesc(a, b) {
      return (Number(b && b.updatedAt) || 0) - (Number(a && a.updatedAt) || 0)
    }

    function isSubagent(row) {
      return row && (row.origin === 'subagent' || (Number(row.depth) || 0) > 0)
    }

    function formatTime(ms) {
      const n = Number(ms)
      if (!n || !isFinite(n)) return ''
      const d = new Date(n)
      const now = new Date()
      const sameDay =
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      const p = (x) => (x < 10 ? '0' + x : '' + x)
      if (sameDay) return p(d.getHours()) + ':' + p(d.getMinutes())
      return p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
    }

    /** Subscribe a component to one ObservableSnapshot store. */
    function useSnapshot(store) {
      const [snap, setSnap] = React.useState(() => store.getSnapshot())
      React.useEffect(() => {
        let alive = true
        const update = () => {
          if (alive) setSnap(store.getSnapshot())
        }
        update()
        const dispose = store.subscribe(update)
        return () => {
          alive = false
          if (typeof dispose === 'function') dispose()
        }
      }, [store])
      return snap
    }

    // ---------------------------------------------------------------- actions

    function createActions(ctx) {
      async function reveal() {
        const layout = ctx.get('layout')
        if (layout && typeof layout.selectPanel === 'function') {
          try {
            layout.selectPanel('conversation')
          } catch (error) {
            console.error('[session-hub] selectPanel failed:', error)
          }
        }
      }
      return {
        async openSession(sessionId) {
          const uiWorkspace = ctx.uiWorkspace || ctx.get('uiWorkspace')
          if (uiWorkspace && typeof uiWorkspace.openSession === 'function') {
            try {
              await uiWorkspace.openSession(sessionId)
              await reveal()
              return
            } catch (error) {
              console.error('[session-hub] openSession failed:', error)
            }
          }
          try {
            const sessions = ctx.get('sessions')
            if (sessions && typeof sessions.retain === 'function') {
              sessions.retain(sessionId, { source: 'mainView' })
            }
            await reveal()
          } catch (error) {
            console.error('[session-hub] fallback open failed:', error)
          }
        },
        async newSession(workspaceId) {
          const uiWorkspace = ctx.uiWorkspace || ctx.get('uiWorkspace')
          if (uiWorkspace && typeof uiWorkspace.startSession === 'function') {
            try {
              await uiWorkspace.startSession(workspaceId)
              await reveal()
              return
            } catch (error) {
              console.error('[session-hub] startSession failed:', error)
            }
          }
          try {
            const sessions = ctx.get('sessions')
            const id = await sessions.create({ workspaceId })
            if (id) {
              if (typeof sessions.retain === 'function') {
                sessions.retain(id, { source: 'mainView' })
              }
              await reveal()
            }
          } catch (error) {
            console.error('[session-hub] fallback create failed:', error)
          }
        },
        async openWorkspace(workspaceId) {
          const uiWorkspace = ctx.uiWorkspace || ctx.get('uiWorkspace')
          if (uiWorkspace && typeof uiWorkspace.openWorkspace === 'function') {
            try {
              await uiWorkspace.openWorkspace(workspaceId)
              await reveal()
            } catch (error) {
              console.error('[session-hub] openWorkspace failed:', error)
            }
          }
        },
      }
    }

    // ------------------------------------------------------------- components

    /** The rail glyph; the shell owns the button, label, active highlight. */
    function HubIcon(props) {
      const size = Number(props && props.size) || 16
      return React.createElement(
        'svg',
        {
          'data-dsh-panel-entry': PANEL_ID,
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.3,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
        },
        React.createElement('circle', { key: 'c', cx: 8, cy: 8, r: 2 }),
        React.createElement('path', {
          key: 'p',
          d: 'M8 1.8v2.7M8 11.5v2.7M1.8 8h2.7M11.5 8h2.7',
        }),
      )
    }

    function SessionRow(props) {
      const { row, t, actions, workspaceTitle, current } = props
      const kind = statusOf(row)
      const title = row.title || row.displayTitle || t('session.untitled')
      return React.createElement(
        'div',
        { className: 'shub-row' + (current ? ' active' : '') },
        React.createElement('span', {
          className: 'shub-dot',
          style: kind ? { background: STATUS_COLORS[kind] } : undefined,
          title: statusLabel(kind, t) || undefined,
        }),
        React.createElement(
          'div',
          { className: 'shub-row-main' },
          React.createElement(
            'div',
            { className: 'shub-row-top' },
            React.createElement('span', { className: 'shub-title', title: title }, title),
            React.createElement('span', { className: 'shub-time' }, formatTime(row.updatedAt)),
            current ? React.createElement('span', { className: 'shub-badge' }, t('badge.current')) : null,
          ),
          workspaceTitle
            ? React.createElement('div', { className: 'shub-row-sub', title: workspaceTitle }, workspaceTitle)
            : null,
        ),
        React.createElement(
          'button',
          {
            className: 'shub-new-btn',
            type: 'button',
            title: t('action.openSession'),
            onClick: () => actions.openSession(row.sessionId),
          },
          t('action.openSession'),
        ),
      )
    }

    function WorkspaceRow(props) {
      const { ws, sessionCount, t, actions } = props
      const title = ws.title || basename(ws.path) || ws.workspaceId
      return React.createElement(
        'div',
        { className: 'shub-ws-row', key: ws.workspaceId },
        React.createElement(
          'div',
          { className: 'shub-ws-main' },
          React.createElement(
            'div',
            { className: 'shub-ws-top' },
            React.createElement(
              'button',
              {
                className: 'shub-ws-title',
                type: 'button',
                title: String(ws.path || ''),
                onClick: () => actions.openWorkspace(ws.workspaceId),
              },
              title,
            ),
            sessionCount > 0
              ? React.createElement('span', { className: 'shub-ws-count' }, t('ws.sessions', { count: sessionCount }))
              : null,
          ),
          React.createElement('span', { className: 'shub-ws-path', title: String(ws.path || '') }, String(ws.path || '')),
        ),
        React.createElement(
          'button',
          {
            className: 'shub-new-btn',
            type: 'button',
            title: t('action.newSession'),
            onClick: () => actions.newSession(ws.workspaceId),
          },
          '+ ' + t('action.newSession'),
        ),
      )
    }

    function Section(props) {
      const { title, count, children } = props
      return React.createElement(
        'section',
        { className: 'shub-section' },
        React.createElement(
          'div',
          { className: 'shub-section-title' },
          title,
          count !== undefined && count > 0
            ? React.createElement('span', { className: 'shub-count' }, String(count))
            : null,
        ),
        React.createElement(
          'div',
          { className: 'shub-section-body' },
          children,
        ),
      )
    }

    /** The main-slot page. */
    function HubPanel(props) {
      const { sessions, workspaces, t, actions } = props
      const sessionSnap = useSnapshot(sessions.list)
      const wsSnap = useSnapshot(workspaces.list)

      const rows = React.useMemo(() => {
        const byId = sessionSnap && sessionSnap.byId ? sessionSnap.byId : {}
        return Object.keys(byId)
          .map((id) => {
            const row = byId[id]
            if (!row) return null
            // byId row objects carry no sessionId field; the map key is the id.
            return typeof row.sessionId === 'string' && row.sessionId !== ''
              ? row
              : Object.assign({}, row, { sessionId: id })
          })
          .filter(Boolean)
      }, [sessionSnap])

      const currentId = React.useMemo(() => {
        for (const row of rows) {
          if (((row.retainedBy && row.retainedBy.mainView) || 0) > 0) return row.sessionId
        }
        return undefined
      }, [rows])

      const archived = React.useMemo(
        () => new Set(toIds(wsSnap && wsSnap.archivedSessionIds)),
        [wsSnap],
      )

      const wsBySession = React.useMemo(() => {
        const map = new Map()
        for (const ws of (wsSnap && wsSnap.items) || []) {
          for (const sid of toIds(ws.sessionIds)) {
            if (!map.has(sid)) map.set(sid, ws)
          }
        }
        return map
      }, [wsSnap])

      const runningRows = React.useMemo(
        () =>
          rows
            .filter((r) => r.running && !isSubagent(r) && !archived.has(r.sessionId))
            .sort(byUpdatedDesc),
        [rows, archived],
      )

      const runningIds = React.useMemo(
        () => new Set(runningRows.map((r) => r.sessionId)),
        [runningRows],
      )

      const recentRows = React.useMemo(
        () =>
          rows
            .filter(
              (r) =>
                !r.blank && !isSubagent(r) && !archived.has(r.sessionId) && !runningIds.has(r.sessionId),
            )
            .sort(byUpdatedDesc)
            .slice(0, 30),
        [rows, archived, runningIds],
      )

      const wsItems = (wsSnap && wsSnap.items) || []
      const loading =
        (!sessionSnap || sessionSnap.phase === 'pending') ||
        (!wsSnap || wsSnap.state === 'loading')

      return React.createElement(
        'div',
        { className: 'shub-panel', 'data-dsh-session-hub-view': '' },
        React.createElement(
          'style',
          { key: 'shub-css' },
          CSS,
        ),
        loading ? React.createElement('div', { className: 'shub-loading' }, '…') : null,
        React.createElement(
          'div',
          { className: 'shub-inner' },
          React.createElement(
            Section,
            { title: t('section.workspaces'), count: wsItems.length || undefined },
            wsItems.length === 0 && !loading
              ? React.createElement('div', { className: 'shub-empty' }, t('empty.workspaces'))
              : React.createElement(
                  'div',
                  null,
                  wsItems.map((ws) =>
                    React.createElement(WorkspaceRow, {
                      key: ws.workspaceId,
                      ws,
                      sessionCount: toIds(ws.sessionIds).length,
                      t,
                      actions,
                    }),
                  ),
                ),
          ),

          React.createElement(
            Section,
            { title: t('section.recent'), count: recentRows.length || undefined },
            recentRows.length === 0 && !loading
              ? React.createElement('div', { className: 'shub-empty' }, t('empty.recent'))
              : recentRows.map((row) =>
                  React.createElement(SessionRow, {
                    key: row.sessionId,
                    row,
                    t,
                    actions,
                    workspaceTitle: (function () {
                      const ws = wsBySession.get(row.sessionId)
                      return ws ? ws.title || basename(ws.path) : ''
                    })(),
                    current: row.sessionId === currentId,
                  }),
                ),
          ),

          React.createElement(
            Section,
            { title: t('section.running'), count: runningRows.length || undefined },
            runningRows.length === 0
              ? React.createElement('div', { className: 'shub-empty' }, t('empty.running'))
              : runningRows.map((row) =>
                  React.createElement(SessionRow, {
                    key: row.sessionId,
                    row,
                    t,
                    actions,
                    workspaceTitle: (function () {
                      const ws = wsBySession.get(row.sessionId)
                      return ws ? ws.title || basename(ws.path) : ''
                    })(),
                    current: row.sessionId === currentId,
                  }),
                ),
          ),
        ),
      )
    }

    // ------------------------------------------------------------------ apply

    return {
      inject: ['slots', 'locale', 'sessions', 'workspaces', 'layout', 'uiWorkspace'],
      apply(ctx) {
        ctx.effect(() => {
          try {
            return ctx.locale.register(NS, { zh: ZH, en: EN })
          } catch (error) {
            console.error('[session-hub] locale register failed:', error)
            return () => {}
          }
        }, NS + ': dictionaries')
        const t = ctx.locale.bind(NS)
        const actions = createActions(ctx)

        const disposers = []
        try {
          const slots = ctx.slots
          disposers.push(
            slots.inject('sidebar.panellist', () =>
              slots.register(
                {
                  name: 'sidebar.panellist',
                  id: PANEL_ID,
                  order: PANEL_ORDER,
                  label: () => t('panel.label'),
                },
                HubIcon,
              ),
            ),
          )
          disposers.push(
            slots.inject('main', () =>
              slots.register(
                {
                  name: 'main',
                  key: PANEL_ID,
                  inject: () => ({
                    sessions: ctx.get('sessions'),
                    workspaces: ctx.get('workspaces'),
                    t,
                    actions,
                  }),
                },
                HubPanel,
              ),
            ),
          )
        } catch (error) {
          // A shell that cannot serve the seats degrades the panel, never the GUI.
          console.error('[session-hub] panel registration failed:', error)
        }
        ctx.effect(() => () => {
          for (const dispose of disposers.splice(0)) dispose()
        }, NS + ': panels')
      },
    }
  },
})
