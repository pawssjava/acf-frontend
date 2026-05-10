import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchSmsLog } from '../../api/smsLog';
import type { SmsAction, SmsLogEntry, SmsLogPage } from '../../types';
import Badge from '../../components/ui/Badge';
import styles from './SmsLogPage.module.css';

const PAGE_SIZE = 20;

type StatusFilter = 'all' | 'used' | 'unused';
type ActionFilter = 'all' | SmsAction;

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildPages(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const set = new Set([
    0, total - 1,
    current - 2, current - 1, current, current + 1, current + 2,
  ]);
  const sorted = [...set].filter(n => n >= 0 && n < total).sort((a, b) => a - b);
  const result: (number | '…')[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…');
    result.push(sorted[i]);
  }
  return result;
}

function ExpandedRow({ entry }: { entry: SmsLogEntry }) {
  return (
    <tr className={styles.expandRow}>
      <td colSpan={6}>
        <div className={styles.expandContent}>
          <div className={styles.expandItem}>
            <span className={styles.expandLabel}>Код:</span>
            <code className={styles.code}>{entry.code}</code>
          </div>
          <div className={styles.expandItem}>
            <span className={styles.expandLabel}>Истекает:</span>
            <span className={styles.expandValue}>{entry.expiresAt}</span>
          </div>
          <div className={styles.expandItem}>
            <span className={styles.expandLabel}>Отправлен (ISO):</span>
            <span className={styles.expandValue}>{entry.sentAt}</span>
          </div>
          {entry.verifiedAt && (
            <div className={styles.expandItem}>
              <span className={styles.expandLabel}>Подтверждён (ISO):</span>
              <span className={styles.expandValue}>{entry.verifiedAt}</span>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function SmsLogPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [data, setData] = useState<SmsLogPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'forbidden' | 'other' | null>(null);
  const [page, setPage] = useState(0);

  const [phoneInput, setPhoneInput] = useState('');
  const [phone, setPhone] = useState('');
  // NOTE: action is filtered client-side on the current page because the API does not
  // support an action query parameter. For large datasets this limits accuracy — the
  // filter only applies within the currently loaded page, not the full dataset.
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [expandedId, setExpandedId] = useState<number | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params: { phone?: string; used?: boolean; page: number; size: number } = {
      page,
      size: PAGE_SIZE,
    };
    if (phone) params.phone = phone;
    if (statusFilter === 'used') params.used = true;
    else if (statusFilter === 'unused') params.used = false;

    fetchSmsLog(params)
      .then(r => setData(r.data))
      .catch((err: { response?: { status?: number } }) => {
        if (err?.response?.status === 403) setError('forbidden');
        else setError('other');
      })
      .finally(() => setLoading(false));
  }, [page, phone, statusFilter]);

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) return;
    load();
  }, [load, isAuthenticated, user?.isAdmin]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhoneInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPhone(val);
      setPage(0);
    }, 400);
  };

  const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActionFilter(e.target.value as ActionFilter);
    setPage(0);
  };

  const handleStatusChange = (v: StatusFilter) => {
    setStatusFilter(v);
    setPage(0);
  };

  const clearFilters = () => {
    setPhoneInput('');
    setPhone('');
    setActionFilter('all');
    setStatusFilter('all');
    setPage(0);
  };

  const rows =
    data && actionFilter !== 'all'
      ? data.content.filter(r => r.action === actionFilter)
      : data?.content ?? [];

  const from = data && data.totalElements > 0 ? page * PAGE_SIZE + 1 : 0;
  const to = data ? Math.min((page + 1) * PAGE_SIZE, data.totalElements) : 0;

  if (error === 'forbidden') {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.errorBox}>У вас нет прав администратора для просмотра этой страницы.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>SMS Log</h1>

        <div className={styles.filtersBar}>
          <input
            type="text"
            value={phoneInput}
            onChange={handlePhoneChange}
            placeholder="🔍 Поиск по номеру телефона"
            className={styles.phoneInput}
          />
          <select
            value={actionFilter}
            onChange={handleActionChange}
            className={styles.select}
          >
            <option value="all">Все действия</option>
            <option value="REGISTRATION">Регистрация</option>
            <option value="FORGOT_PASSWORD">Забыл пароль</option>
          </select>
          <div className={styles.segmented}>
            {(['all', 'used', 'unused'] as StatusFilter[]).map(v => (
              <button
                key={v}
                className={[styles.segBtn, statusFilter === v ? styles.segBtnActive : ''].join(' ')}
                onClick={() => handleStatusChange(v)}
              >
                {v === 'all' ? 'Все' : v === 'used' ? 'Использован' : 'Не использован'}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.tableCard}>
          {loading ? (
            <div className={styles.skeleton}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeletonRow} />
              ))}
            </div>
          ) : error === 'other' ? (
            <div className={styles.stateBox}>
              <p>Не удалось загрузить данные. Попробуйте снова.</p>
              <button className={styles.actionBtn} onClick={load}>Повторить</button>
            </div>
          ) : rows.length === 0 ? (
            <div className={styles.stateBox}>
              <p>Нет SMS-кодов, соответствующих текущим фильтрам.</p>
              <button className={styles.actionBtn} onClick={clearFilters}>Сбросить фильтры</button>
            </div>
          ) : (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.thId}>ID</th>
                      <th>Телефон</th>
                      <th>Действие</th>
                      <th>Отправлен</th>
                      <th>Подтверждён</th>
                      <th>Использован</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(row => (
                      <React.Fragment key={row.id}>
                        <tr
                          className={[styles.dataRow, expandedId === row.id ? styles.dataRowExpanded : ''].join(' ')}
                          onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                        >
                          <td className={styles.tdId}>{row.id}</td>
                          <td>{row.phoneNumber}</td>
                          <td>
                            <Badge variant={row.action === 'REGISTRATION' ? 'blue' : 'yellow'}>
                              {row.action === 'REGISTRATION' ? 'Регистрация' : 'Забыл пароль'}
                            </Badge>
                          </td>
                          <td className={styles.dateCell}>{fmtDate(row.sentAt)}</td>
                          <td className={styles.dateCell}>
                            {row.verifiedAt
                              ? fmtDate(row.verifiedAt)
                              : <span className={styles.dash}>—</span>}
                          </td>
                          <td>
                            <Badge variant={row.used ? 'teal' : 'gray'}>
                              {row.used ? 'Да' : 'Нет'}
                            </Badge>
                          </td>
                        </tr>
                        {expandedId === row.id && <ExpandedRow entry={row} />}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.tableFooter}>
                <span className={styles.totalInfo}>
                  Показано {from}–{to} из {data?.totalElements ?? 0}
                </span>

                {data && data.totalPages > 1 && (
                  <div className={styles.pagination}>
                    <button
                      className={styles.pageBtn}
                      disabled={page === 0}
                      onClick={() => setPage(p => p - 1)}
                    >
                      ← Назад
                    </button>
                    <div className={styles.pageNumbers}>
                      {buildPages(page, data.totalPages).map((item, i) =>
                        item === '…' ? (
                          <span key={`el-${i}`} className={styles.ellipsis}>…</span>
                        ) : (
                          <button
                            key={item}
                            className={[styles.pageNum, item === page ? styles.pageNumActive : ''].join(' ')}
                            onClick={() => setPage(item)}
                          >
                            {item + 1}
                          </button>
                        )
                      )}
                    </div>
                    <button
                      className={styles.pageBtn}
                      disabled={page === data.totalPages - 1}
                      onClick={() => setPage(p => p + 1)}
                    >
                      Вперёд →
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
