// app/pages/wallets/page.tsx
/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Dropdown } from 'primereact/dropdown';
import { ProgressBar } from 'primereact/progressbar';
import { Badge } from 'primereact/badge';
import { Divider } from 'primereact/divider';
import { Avatar } from 'primereact/avatar';
import { Chip } from 'primereact/chip';
import withAuth from '../../authGuard';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import { Paginator } from 'primereact/paginator';
import { isRTL } from '../../utilities/rtlUtil';
import { customCellStyle } from '../../utilities/customRow';
import i18n from '@/i18n';
import Swal from 'sweetalert2';
import { Card } from 'primereact/card';

import {
    _fetchAllWallets,
    _fetchWalletDetails,
    _fetchWalletStatistics,
    _transferBetweenWallets
} from '@/app/redux/actions/walletActions';
import { _fetchCurrencies } from '@/app/redux/actions/currenciesActions';
import { _fetchResellers } from '@/app/redux/actions/resellerActions';
import { AppDispatch } from '@/app/redux/store';

const WalletsPage = () => {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const { t } = useTranslation();
    const toast = useRef<Toast>(null);
    const searchParams = useSearchParams();

    // Redux state
    const { allWallets, loading, statistics, walletDetails } = useSelector((state: any) => state.walletReducer);
    const { currencies } = useSelector((state: any) => state.currenciesReducer);
    const { resellers } = useSelector((state: any) => state.resellerReducer);

    // Local state
    const [globalFilter, setGlobalFilter] = useState('');
    const [searchTag, setSearchTag] = useState('');
    const [filterDialogVisible, setFilterDialogVisible] = useState(false);
    const [transferDialogVisible, setTransferDialogVisible] = useState(false);
    const [detailsDialogVisible, setDetailsDialogVisible] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState<any>(null);
    const [filters, setFilters] = useState({
        filter_status: null as string | null,
        filter_currency: null as string | null,
        filter_min_balance: null as string | null,
        filter_max_balance: null as string | null,
    });
    const [activeFilters, setActiveFilters] = useState({});
    const [refreshing, setRefreshing] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    // Transfer form state
    const [transferData, setTransferData] = useState({
        from_wallet_id: null as number | null,
        to_wallet_id: null as number | null,
        amount: '' as string,
    });
    const [availableWallets, setAvailableWallets] = useState<any[]>([]);

    // Auto-open add dialog from URL param
    useEffect(() => {
        const action = searchParams.get('action');
        if (action === 'transfer') {
            const timer = setTimeout(() => {
                openTransferDialog();
                router.replace('/pages/wallets');
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [searchParams, router]);

    useEffect(() => {
        dispatch(_fetchAllWallets(1, 20, searchTag, activeFilters));
        dispatch(_fetchCurrencies());
        dispatch(_fetchResellers(1, '', {}));
        dispatch(_fetchWalletStatistics());
    }, [dispatch, searchTag, activeFilters]);

    // Prepare available wallets for transfer
    useEffect(() => {
        if (allWallets?.data) {
            setAvailableWallets(allWallets.data);
        }
    }, [allWallets]);

    // Click outside handler for filter dialog
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (target.closest('.p-dropdown-panel')) return;
            if (filterDialogVisible && filterRef.current && !filterRef.current.contains(target)) {
                setFilterDialogVisible(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [filterDialogVisible]);

    const handleSubmitFilter = (filters: any) => {
        const cleanedFilters = Object.fromEntries(
            Object.entries(filters).filter(([_, value]) => value !== null && value !== '')
        );
        setActiveFilters(cleanedFilters);
        setFilterDialogVisible(false);
    };

    const onPageChange = (event: any) => {
        const page = event.page + 1;
        dispatch(_fetchAllWallets(page, 20, searchTag, activeFilters));
    };

    const viewWalletDetails = async (wallet: any) => {
        setSelectedWallet(wallet);
        await dispatch(_fetchWalletDetails(wallet.id, toast, t));
        setDetailsDialogVisible(true);
    };

    const openTransferDialog = () => {
        setTransferData({
            from_wallet_id: null,
            to_wallet_id: null,
            amount: '',
        });
        setTransferDialogVisible(true);
    };

    const handleTransfer = async () => {
        if (!transferData.from_wallet_id || !transferData.to_wallet_id || !transferData.amount) {
            toast.current?.show({
                severity: 'error',
                summary: t('ERROR'),
                detail: t('PLEASE_FILL_ALL_FIELDS'),
                life: 3000,
            });
            return;
        }

        if (transferData.from_wallet_id === transferData.to_wallet_id) {
            toast.current?.show({
                severity: 'error',
                summary: t('ERROR'),
                detail: t('CANNOT_TRANSFER_TO_SAME_WALLET'),
                life: 3000,
            });
            return;
        }

        const result = await Swal.fire({
            title: t('CONFIRM_TRANSFER'),
            text: t('ARE_YOU_SURE_TO_TRANSFER'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: t('YES_TRANSFER'),
            cancelButtonText: t('CANCEL'),
        });

        if (result.isConfirmed) {
            dispatch(_transferBetweenWallets(
                {
                    from_wallet_id: transferData.from_wallet_id,
                    to_wallet_id: transferData.to_wallet_id,
                    amount: parseFloat(transferData.amount),
                },
                toast,
                t
            ));
            setTransferDialogVisible(false);
            setTimeout(() => {
                dispatch(_fetchAllWallets(1, 20, searchTag, activeFilters));
                dispatch(_fetchWalletStatistics());
            }, 1000);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await new Promise((res) => setTimeout(res, 1000));
        dispatch(_fetchAllWallets(1, 20, searchTag, activeFilters));
        dispatch(_fetchWalletStatistics());
        setRefreshing(false);
    };

const rightToolbarTemplate = () => {
    return (
        <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Button
                label={t('TRANSFER_FUNDS')}
                icon="pi pi-arrow-right-arrow-left"
                severity="warning"
                onClick={openTransferDialog}
                className="w-full sm:w-auto"
            />
            <div className="relative w-full sm:w-auto" ref={filterRef}>
                <Button
                    className="p-button-info w-full sm:w-auto"
                    label={t('FILTER')}
                    icon="pi pi-filter"
                    onClick={() => setFilterDialogVisible(!filterDialogVisible)}
                />
                {filterDialogVisible && (
                    <div
                        className="p-card p-fluid absolute"
                        style={{
                            top: '100%',
                            left: isRTL() ? 'auto' : 0,
                            right: isRTL() ? 0 : 'auto',
                            width: '280px',
                            maxWidth: 'calc(100vw - 20px)',
                            zIndex: 1000,
                            marginTop: '0.5rem',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            borderRadius: '8px',
                            background: 'white'
                        }}
                    >
                        <div className="p-card-body" style={{ padding: '1rem' }}>
                            <div className="grid">
                                <div className="col-12">
                                    <label className="text-sm font-bold">{t('WALLETS.STATUS')}</label>
                                    <Dropdown
                                        options={[
                                            { label: t('ACTIVE'), value: '1' },
                                            { label: t('INACTIVE'), value: '0' }
                                        ]}
                                        value={filters.filter_status}
                                        onChange={(e) => setFilters({ ...filters, filter_status: e.value })}
                                        placeholder={t('SELECT_STATUS')}
                                        className="w-full mt-1"
                                    />
                                </div>
                                <div className="col-12 mt-2">
                                    <label className="text-sm font-bold">{t('WALLETS.CURRENCY')}</label>
                                    <Dropdown
                                        options={currencies}
                                        value={filters.filter_currency}
                                        onChange={(e) => setFilters({ ...filters, filter_currency: e.value })}
                                        optionLabel="code"
                                        optionValue="code"
                                        placeholder={t('SELECT_CURRENCY')}
                                        className="w-full mt-1"
                                    />
                                </div>
                                <div className="col-12 mt-2">
                                    <label className="text-sm font-bold">{t('MIN_BALANCE')}</label>
                                    <InputText
                                        type="number"
                                        value={filters.filter_min_balance || ''}
                                        onChange={(e) => setFilters({ ...filters, filter_min_balance: e.target.value })}
                                        placeholder={t('ENTER_MIN_BALANCE')}
                                        className="w-full mt-1"
                                    />
                                </div>
                                <div className="col-12 mt-2">
                                    <label className="text-sm font-bold">{t('MAX_BALANCE')}</label>
                                    <InputText
                                        type="number"
                                        value={filters.filter_max_balance || ''}
                                        onChange={(e) => setFilters({ ...filters, filter_max_balance: e.target.value })}
                                        placeholder={t('ENTER_MAX_BALANCE')}
                                        className="w-full mt-1"
                                    />
                                </div>
                                <div className="col-12 mt-3 flex flex-col sm:flex-row justify-content-between gap-2">
                                    <Button
                                        label={t('RESET')}
                                        icon="pi pi-times"
                                        severity="secondary"
                                        size="small"
                                        className="w-full sm:w-auto"
                                        onClick={() => {
                                            setFilters({
                                                filter_status: null,
                                                filter_currency: null,
                                                filter_min_balance: null,
                                                filter_max_balance: null,
                                            });
                                        }}
                                    />
                                    <Button
                                        label={t('APPLY')}
                                        icon="pi pi-check"
                                        severity="info"
                                        size="small"
                                        className="w-full sm:w-auto"
                                        onClick={() => handleSubmitFilter(filters)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Button
                label={t('EXPORT.EXPORT')}
                icon="pi pi-file-excel"
                severity="success"
                onClick={() => {}}
                className="w-full sm:w-auto"
            />
            <Button
                label={t('REFRESH')}
                icon={`pi pi-refresh ${refreshing ? 'pi-spin' : ''}`}
                severity="secondary"
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full sm:w-auto"
            />
        </div>
    );
};

const leftToolbarTemplate = () => {
    return (
        <div className="flex items-center w-full">
            <span className="block p-input-icon-left w-full">
                <i className="pi pi-search" />
                <InputText
                    type="search"
                    onInput={(e) => setSearchTag(e.currentTarget.value)}
                    placeholder={t('SEARCH_WALLETS')}
                    className="w-full"
                />
            </span>
        </div>
    );
};

    // Statistics Cards at the top
    const statisticsCards = () => {
        const stats = statistics?.summary;
        if (!stats) return null;

        const cards = [
            {
                title: t('TOTAL_WALLETS'),
                value: stats.total_wallets || 0,
                icon: 'pi pi-wallet',
                color: '#3B82F6',
                bgColor: '#EFF6FF',
            },
            {
                title: t('TOTAL_RESELLERS'),
                value: stats.total_resellers || 0,
                icon: 'pi pi-users',
                color: '#10B981',
                bgColor: '#ECFDF5',
            },
            {
                title: t('TOTAL_BALANCE_USD'),
                value: `$${parseFloat(stats.total_balance_usd || 0).toLocaleString()}`,
                icon: 'pi pi-dollar',
                color: '#F59E0B',
                bgColor: '#FFFBEB',
            },
            {
                title: t('NET_WORTH_USD'),
                value: `$${parseFloat(stats.net_worth_usd || 0).toLocaleString()}`,
                icon: 'pi pi-chart-line',
                color: '#8B5CF6',
                bgColor: '#F5F3FF',
            },
        ];

        return (
            <div className="grid mb-4">
                {cards.map((card, index) => (
                    <div key={index} className="col-6 lg:col-3">
                        <Card className="p-2 h-full">
                            <div className="flex align-items-center justify-content-between h-full">
                                <div>
                                    <div className="text-500 mb-2" style={{ fontSize: '0.875rem' }}>
                                        {card.title}
                                    </div>
                                    <div className="text-900 font-bold" style={{ fontSize: '1.5rem' }}>
                                        {card.value}
                                    </div>
                                </div>
                                <div
                                    className="border-circle flex align-items-center justify-content-center flex-shrink-0"
                                    style={{
                                        width: '50px',
                                        height: '50px',
                                        backgroundColor: card.bgColor,
                                        color: card.color,
                                    }}
                                >
                                    <i className={`${card.icon} text-2xl`}></i>
                                </div>
                            </div>
                        </Card>
                    </div>
                ))}
            </div>
        );
    };

    // Currency Breakdown Section - Smaller and Compact
    const currencyBreakdown = () => {
        const breakdown = statistics?.per_currency_breakdown;
        if (!breakdown || breakdown.length === 0) return null;

        return (
            <div className="grid mb-4">
                {breakdown.map((item: any, index: number) => (
                    <div key={index} className="col-6 sm:col-4 md:col-3 lg:col-2">
                        <div className="p-2 border-round" style={{ backgroundColor: '#F8FAFC' }}>
                            <div className="flex align-items-center justify-content-between mb-1">
                                <span className="text-md font-bold">{item.currency_code}</span>
                                <Chip label={`${item.wallet_count}`} />
                            </div>
                            <Divider className="my-1" />
                            <div className="flex justify-content-between align-items-center">
                                <span className="text-xs text-500">{t('BALANCE')}:</span>
                                <span className="text-xs font-bold" style={{ color: '#3B82F6' }}>
                                    {parseFloat(item.total_balance).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-content-between align-items-center mt-1">
                                <span className="text-xs text-500">{t('PAYMENT')}:</span>
                                <span className="text-xs font-bold" style={{ color: '#10B981' }}>
                                    {parseFloat(item.total_payment).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Table Columns
    const resellerBodyTemplate = (rowData: any) => {
        return (
            <div className="flex align-items-center gap-2">
                <Avatar
                    image={rowData.reseller?.profile_image_url || '/demo/images/avatar/user.png'}
                    shape="circle"
                    size="normal"
                />
                <div>
                    <div className="font-bold">{rowData.reseller?.reseller_name || '-'}</div>
                    <small className="text-500">{rowData.reseller?.phone || '-'}</small>
                </div>
            </div>
        );
    };

    const currencyBodyTemplate = (rowData: any) => {
        return (
            <Badge
                value={`${rowData.currency?.code || '-'}`}
                severity="info"
                className="px-2 py-1 text-xs"
            />
        );
    };

    const balanceBodyTemplate = (rowData: any) => {
        const balance = parseFloat(rowData.balance);
        return (
            <span className="font-bold" style={{ color: balance > 0 ? '#10B981' : '#EF4444', fontSize: '0.85rem' }}>
                {balance.toLocaleString()} {rowData.currency?.code}
            </span>
        );
    };

    const paymentBodyTemplate = (rowData: any) => {
        return (
            <span style={{ color: '#F59E0B', fontSize: '0.85rem' }}>
                {parseFloat(rowData.payment).toLocaleString()} {rowData.currency?.code}
            </span>
        );
    };

    const statusBodyTemplate = (rowData: any) => {
        const isActive = rowData.is_active;
        return (
            <span className={`px-2 py-1 border-round-xl text-xs font-semibold ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} w-4rem inline-block text-center`}>
                {isActive ? t('ACTIVE') : t('INACTIVE')}
            </span>
        );
    };

    const defaultBodyTemplate = (rowData: any) => {
        return rowData.is_default ? (
            <i className="pi pi-star-fill" style={{ color: '#F59E0B', fontSize: '1rem' }} />
        ) : (
            <i className="pi pi-star" style={{ color: '#CBD5E1', fontSize: '1rem' }} />
        );
    };

    const actionBodyTemplate = (rowData: any) => {
        return (
            <Button
                icon="pi pi-eye"
                rounded
                text
                severity="info"
                tooltip={t('VIEW_DETAILS')}
                onClick={() => viewWalletDetails(rowData)}
            />
        );
    };

    return (
        <div className="grid crud-demo -m-5">
            <div className="col-12">
                <div className="card p-2">
                    {/* Loading Progress Bar - Same as payment page */}
                    {loading && <ProgressBar mode="indeterminate" style={{ height: '6px' }} />}
                    <Toast ref={toast} />

                    {/* Statistics Cards - Top of Page */}
                    {statisticsCards()}

                    {/* Currency Breakdown - Smaller and Compact */}
                    {currencyBreakdown()}

                    {/* Toolbar */}
                    <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate} />

                    {/* Wallets Table */}
                    <DataTable
                        value={allWallets?.data || []}
                        className="datatable-responsive"
                        responsiveLayout="scroll"
                        emptyMessage={t('DATA_TABLE.TABLE.NO_DATA')}
                        dir={isRTL() ? 'rtl' : 'ltr'}
                        style={{ direction: isRTL() ? 'rtl' : 'ltr' }}
                        loading={loading}
                        onRowClick={(e) => viewWalletDetails(e.data)}
                        rowClassName={() => 'cursor-pointer select-none'}
                    >
                        <Column
                            style={customCellStyle}
                            body={actionBodyTemplate}
                            header={t('ACTIONS')}
                            headerStyle={{ width: '70px' }}
                        />
                        <Column
                            style={customCellStyle}
                            field="id"
                            header={t('ID')}
                            headerStyle={{ width: '70px' }}
                        />
                        <Column
                            style={customCellStyle}
                            body={resellerBodyTemplate}
                            header={t('RESELLER')}
                        />
                        <Column
                            style={customCellStyle}
                            body={currencyBodyTemplate}
                            header={t('WALLETS.CURRENCY')}
                            headerStyle={{ width: '100px' }}
                        />
                        <Column
                            style={customCellStyle}
                            body={balanceBodyTemplate}
                            header={t('WALLETS.BALANCE')}
                        />
                        <Column
                            style={customCellStyle}
                            body={paymentBodyTemplate}
                            header={t('WALLETS.PAYMENT')}
                        />
                        <Column
                            style={customCellStyle}
                            body={defaultBodyTemplate}
                            header={t('WALLETS.IS_DEFAULT')}
                            headerStyle={{ width: '80px' }}
                        />
                        <Column
                            style={customCellStyle}
                            body={statusBodyTemplate}
                            header={t('WALLETS.STATUS')}
                            headerStyle={{ width: '100px' }}
                        />
                    </DataTable>

                    <Paginator
                        first={(allWallets?.pagination?.page - 1) * allWallets?.pagination?.items_per_page}
                        rows={allWallets?.pagination?.items_per_page || 20}
                        totalRecords={allWallets?.pagination?.total || 0}
                        onPageChange={onPageChange}
                        template={
                            isRTL()
                                ? 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown'
                                : 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown'
                        }
                        currentPageReportTemplate={t('DATA_TABLE.TABLE.PAGINATOR.SHOWING')}
                        firstPageLinkIcon={isRTL() ? 'pi pi-angle-double-right' : 'pi pi-angle-double-left'}
                        lastPageLinkIcon={isRTL() ? 'pi pi-angle-double-left' : 'pi pi-angle-double-right'}
                    />

                    {/* Transfer Dialog */}
                    <Dialog
                        visible={transferDialogVisible}
                        header={t('TRANSFER_BETWEEN_WALLETS')}
                        onHide={() => setTransferDialogVisible(false)}
                        style={{ width: '500px', maxWidth: '95vw' }}
                        footer={
                            <div className="flex justify-content-end gap-2">
                                <Button
                                    label={t('APP.GENERAL.CANCEL')}
                                    icon="pi pi-times"
                                    severity="danger"
                                    onClick={() => setTransferDialogVisible(false)}
                                />
                                <Button
                                    label={t('TRANSFER')}
                                    icon="pi pi-arrow-right-arrow-left"
                                    severity="success"
                                    onClick={handleTransfer}
                                />
                            </div>
                        }
                    >
                        <div className="flex flex-column gap-3">
                            <div>
                                <label className="font-bold mb-2 block">
                                    {t('FROM_WALLET')} <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    value={transferData.from_wallet_id}
                                    options={availableWallets}
                                    onChange={(e) => setTransferData({ ...transferData, from_wallet_id: e.value })}
                                    optionLabel="id"
                                    optionValue="id"
                                    placeholder={t('SELECT_SOURCE_WALLET')}
                                    className="w-full"
                                    itemTemplate={(option) => (
                                        <div className="flex justify-content-between align-items-center">
                                            <span>#{option.id}</span>
                                            <span className="text-500 text-sm">
                                                {option.reseller?.reseller_name} - {option.currency?.code}
                                            </span>
                                            <span className="font-bold text-green-500 text-sm">
                                                {parseFloat(option.balance).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                />
                            </div>
                            <div>
                                <label className="font-bold mb-2 block">
                                    {t('TO_WALLET')} <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    value={transferData.to_wallet_id}
                                    options={availableWallets.filter(
                                        (w) => w.id !== transferData.from_wallet_id
                                    )}
                                    onChange={(e) => setTransferData({ ...transferData, to_wallet_id: e.value })}
                                    optionLabel="id"
                                    optionValue="id"
                                    placeholder={t('SELECT_DESTINATION_WALLET')}
                                    className="w-full"
                                    itemTemplate={(option) => (
                                        <div className="flex justify-content-between align-items-center">
                                            <span>#{option.id}</span>
                                            <span className="text-500 text-sm">
                                                {option.reseller?.reseller_name} - {option.currency?.code}
                                            </span>
                                        </div>
                                    )}
                                />
                            </div>
                            <div>
                                <label className="font-bold mb-2 block">
                                    {t('AMOUNT')} <span className="text-red-500">*</span>
                                </label>
                                <InputText
                                    type="number"
                                    value={transferData.amount}
                                    onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                                    placeholder={t('ENTER_AMOUNT_TO_TRANSFER')}
                                    className="w-full"
                                />
                            </div>
                            {transferData.from_wallet_id && (
                                <div className="p-2 border-round bg-blue-50">
                                    <small className="text-600">
                                        {t('AVAILABLE_BALANCE')}:{' '}
                                        <strong>
                                            {parseFloat(availableWallets.find((w) => w.id === transferData.from_wallet_id)?.balance || 0).toLocaleString()}{' '}
                                            {availableWallets.find((w) => w.id === transferData.from_wallet_id)?.currency?.code}
                                        </strong>
                                    </small>
                                </div>
                            )}
                        </div>
                    </Dialog>

                    {/* Wallet Details Dialog - Similar to Payment View Dialog */}
                    <Dialog
                        visible={detailsDialogVisible}
                        style={{ width: '380px', maxWidth: '95vw', padding: 0 }}
                        header={null}
                        modal
                        onHide={() => setDetailsDialogVisible(false)}
                        closable={false}
                    >
                        {walletDetails && (
                            <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                                {/* Header */}
                                <div style={{
                                    textAlign: 'center',
                                    padding: '1rem',
                                    borderBottom: '2px dashed #e5e7eb',
                                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
                                }}>
                                    <div
                                        className="border-circle inline-flex align-items-center justify-content-center mb-2"
                                        style={{
                                            width: '60px',
                                            height: '60px',
                                            backgroundColor: '#EFF6FF',
                                        }}
                                    >
                                        <i className="pi pi-wallet text-3xl" style={{ color: '#3B82F6' }}></i>
                                    </div>
                                    <div style={{
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        color: '#1f2937'
                                    }}>
                                        {t('WALLET_DETAILS')}
                                    </div>
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '20px',
                                        fontSize: '0.65rem',
                                        fontWeight: 'bold',
                                        marginTop: '0.5rem',
                                        backgroundColor: walletDetails.is_active ? '#10b981' : '#ef4444',
                                        color: 'white'
                                    }}>
                                        {walletDetails.is_active ? t('ACTIVE') : t('INACTIVE')}
                                    </div>
                                </div>

                                {/* Content */}
                                <div style={{ padding: '1rem' }}>
                                    <div className="grid" style={{ margin: 0 }}>
                                        <div className="col-6" style={{ padding: '0.25rem' }}>
                                            <div className="text-xs text-500">{t('WALLET_ID')}</div>
                                            <div className="text-sm font-bold">#{walletDetails.id}</div>
                                        </div>
                                        <div className="col-6" style={{ padding: '0.25rem' }}>
                                            <div className="text-xs text-500">{t('WALLETS.CURRENCY')}</div>
                                            <div className="text-sm font-bold">{walletDetails.currency?.code}</div>
                                        </div>
                                        <div className="col-12" style={{ padding: '0.25rem' }}>
                                            <div className="text-xs text-500">{t('RESELLER')}</div>
                                            <div className="text-sm font-semibold">{walletDetails.reseller?.name || '-'}</div>
                                        </div>
                                        <div className="col-12" style={{ padding: '0.25rem' }}>
                                            <div className="text-xs text-500">{t('PHONE')}</div>
                                            <div className="text-sm">{walletDetails.reseller?.phone || '-'}</div>
                                        </div>
                                        <Divider className="my-1" />
                                        <div className="col-6" style={{ padding: '0.25rem' }}>
                                            <div className="text-xs text-500">{t('WALLETS.BALANCE')}</div>
                                            <div className="text-sm font-bold text-green-600">
                                                {parseFloat(walletDetails.balance).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="col-6" style={{ padding: '0.25rem' }}>
                                            <div className="text-xs text-500">{t('WALLETS.PAYMENT')}</div>
                                            <div className="text-sm font-bold text-orange-500">
                                                {parseFloat(walletDetails.payment).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="col-6" style={{ padding: '0.25rem' }}>
                                            <div className="text-xs text-500">{t('AVAILABLE_BALANCE')}</div>
                                            <div className="text-sm font-bold text-blue-600">
                                                {parseFloat(walletDetails.available_balance).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="col-6" style={{ padding: '0.25rem' }}>
                                            <div className="text-xs text-500">{t('LOAN_BALANCE')}</div>
                                            <div className="text-sm font-bold text-purple-600">
                                                {parseFloat(walletDetails.loan_balance).toLocaleString()}
                                            </div>
                                        </div>
                                        <Divider className="my-1" />
                                        <div className="col-6" style={{ padding: '0.25rem' }}>
                                            <div className="text-xs text-500">{t('WALLETS.IS_DEFAULT')}</div>
                                            {walletDetails.is_default ? (
                                                <i className="pi pi-star-fill" style={{ color: '#F59E0B', fontSize: '0.9rem' }} />
                                            ) : (
                                                <i className="pi pi-star" style={{ color: '#CBD5E1', fontSize: '0.9rem' }} />
                                            )}
                                        </div>
                                        <div className="col-12" style={{ padding: '0.25rem' }}>
                                            <div className="text-xs text-500">{t('CREATED_AT')}</div>
                                            <div className="text-xs text-600">
                                                {new Date(walletDetails.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div style={{
                                    padding: '0.75rem',
                                    borderTop: '2px dashed #e5e7eb',
                                    display: 'flex',
                                    justifyContent: 'flex-end'
                                }}>
                                    <Button
                                        label={t('CLOSE')}
                                        icon="pi pi-times"
                                        onClick={() => setDetailsDialogVisible(false)}
                                        className="p-button-text p-button-sm"
                                    />
                                </div>
                            </div>
                        )}
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default withAuth(WalletsPage);
