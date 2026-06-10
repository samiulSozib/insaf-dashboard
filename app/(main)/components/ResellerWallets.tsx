// app/(main)/components/ResellerWallets.tsx
'use client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { ProgressBar } from 'primereact/progressbar';
import { Dropdown } from 'primereact/dropdown';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/app/redux/store';
import { useTranslation } from 'react-i18next';
import { isRTL } from '../utilities/rtlUtil';
import {
    _fetchResellerWallets,
    _addBalanceToWallet,
    _addPaymentToWallet,
    _deductBalanceFromWallet,
    _deductPaymentFromWallet,
    _setDefaultWallet,
    _activateWallet,
    _deactivateWallet,
    _createWallet
} from '@/app/redux/actions/walletActions';
import { Currency, ResellerWallet } from '@/types/interface';
import { _fetchCurrencies } from '@/app/redux/actions/currenciesActions';

interface ResellerWalletsProps {
    resellerId: number;
}

const ResellerWallets = ({ resellerId }: ResellerWalletsProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const { resellerWallets, loading } = useSelector((state: any) => state.walletReducer);
    const { t } = useTranslation();
    const toast = useRef<Toast>(null);

    const [addBalanceDialog, setAddBalanceDialog] = useState(false);
    const [addPaymentDialog, setAddPaymentDialog] = useState(false);
    const [deductBalanceDialog, setDeductBalanceDialog] = useState(false);
    const [deductPaymentDialog, setDeductPaymentDialog] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState<ResellerWallet | null>(null);
    const [amount, setAmount] = useState('');
    const [createWalletDialog, setCreateWalletDialog] = useState(false);
    const [newWalletData, setNewWalletData] = useState({
        currency_code: '',
        initial_balance: 0,
        initial_payment: 0,
        set_as_default: false,
        set_as_active: true
    });

    // const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>([
    //     { id: 1, code: 'AFN', symbol: 'AFN', name: 'Afghani' },
    //     { id: 4, code: 'TMN', symbol: 'TMN', name: 'Toman' },
    //     { id: 12, code: 'USD', symbol: '$', name: 'USD' }
    // ]);
    const { currencies } = useSelector((state: any) => state.currenciesReducer);

    useEffect(() => {
        if (resellerId) {
            dispatch(_fetchCurrencies());
            dispatch(_fetchResellerWallets(resellerId, toast, t));
        }
    }, [dispatch, resellerId, t]);

    const handleAddBalance = () => {
        if (selectedWallet && amount) {
            dispatch(_addBalanceToWallet(selectedWallet.wallet_id, parseFloat(amount), toast, t));
            setAddBalanceDialog(false);
            setAmount('');
            setSelectedWallet(null);
        }
    };

    const handleAddPayment = () => {
        if (selectedWallet && amount) {
            dispatch(_addPaymentToWallet(selectedWallet.wallet_id, parseFloat(amount), toast, t));
            setAddPaymentDialog(false);
            setAmount('');
            setSelectedWallet(null);
        }
    };

    const handleDeductBalance = () => {
        if (selectedWallet && amount) {
            dispatch(_deductBalanceFromWallet(selectedWallet.wallet_id, parseFloat(amount), toast, t));
            setDeductBalanceDialog(false);
            setAmount('');
            setSelectedWallet(null);
        }
    };

    const handleDeductPayment = () => {
        if (selectedWallet && amount) {
            dispatch(_deductPaymentFromWallet(selectedWallet.wallet_id, parseFloat(amount), toast, t));
            setDeductPaymentDialog(false);
            setAmount('');
            setSelectedWallet(null);
        }
    };

    const handleSetDefault = (wallet: ResellerWallet) => {
        dispatch(_setDefaultWallet(wallet.wallet_id, toast, t));
    };

    const handleToggleActive = (wallet: ResellerWallet) => {
        if (wallet.is_active) {
            dispatch(_deactivateWallet(wallet.wallet_id, toast, t));
        } else {
            dispatch(_activateWallet(wallet.wallet_id, toast, t));
        }
    };

    const handleCreateWallet = () => {
        if (newWalletData.currency_code) {
            dispatch(_createWallet(resellerId, newWalletData, toast, t));
            setCreateWalletDialog(false);
            setNewWalletData({
                currency_code: '',
                initial_balance: 0,
                initial_payment: 0,
                set_as_default: false,
                set_as_active: true
            });
        }
    };

    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="flex flex-wrap gap-2">
                    <Button
                        label={t('WALLETS.CREATE_NEW')}
                        icon="pi pi-plus"
                        severity="success"
                        onClick={() => setCreateWalletDialog(true)}
                    />
                </div>
            </React.Fragment>
        );
    };

    const rightToolbarTemplate = () => {
        return (
            <React.Fragment>
                <Button
                    label={t('REFRESH')}
                    icon="pi pi-refresh"
                    severity="secondary"
                    onClick={() => dispatch(_fetchResellerWallets(resellerId, toast, t))}
                />
            </React.Fragment>
        );
    };

    const currencyBodyTemplate = (rowData: ResellerWallet) => {
        return (
            <>
                <span className="p-column-title">{t('WALLETS.CURRENCY')}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                    {rowData.currency?.code || 'N/A'} ({rowData.currency?.symbol || ''})
                </span>
            </>
        );
    };

    const balanceBodyTemplate = (rowData: ResellerWallet) => {
        return (
            <>
                <span className="p-column-title">{t('WALLETS.BALANCE')}</span>
                <span style={{ fontSize: '0.9rem', color: '#2196F3', fontWeight: 'bold' }}>
                    {rowData.balance}
                </span>
            </>
        );
    };

    const paymentBodyTemplate = (rowData: ResellerWallet) => {
        return (
            <>
                <span className="p-column-title">{t('WALLETS.PAYMENT')}</span>
                <span style={{ fontSize: '0.9rem', color: '#4CAF50', fontWeight: 'bold' }}>
                    {rowData.payment}
                </span>
            </>
        );
    };

    const availableBalanceBodyTemplate = (rowData: ResellerWallet) => {
        return (
            <>
                <span className="p-column-title">{t('WALLETS.AVAILABLE_BALANCE')}</span>
                <span style={{ fontSize: '0.9rem', color: '#FF9800', fontWeight: 'bold' }}>
                    {rowData.available_balance}
                </span>
            </>
        );
    };

    const defaultBodyTemplate = (rowData: ResellerWallet) => {
        return (
            <>
                <span className="p-column-title">{t('WALLETS.IS_DEFAULT')}</span>
                {rowData.is_default ? (
                    <i className="pi pi-check-circle" style={{ color: '#4CAF50', fontSize: '1.2rem' }} />
                ) : (
                    <Button
                        icon="pi pi-star"
                        rounded
                        text
                        severity="info"
                        tooltip={t('WALLETS.SET_AS_DEFAULT')}
                        onClick={() => handleSetDefault(rowData)}
                    />
                )}
            </>
        );
    };

    const statusBodyTemplate = (rowData: ResellerWallet) => {
        return (
            <>
                <span className="p-column-title">{t('WALLETS.STATUS')}</span>
                <Button
                    label={rowData.is_active ? t('ACTIVE') : t('INACTIVE')}
                    severity={rowData.is_active ? "success" : "danger"}
                    text
                    rounded
                    size="small"
                    onClick={() => handleToggleActive(rowData)}
                />
            </>
        );
    };

    const actionsBodyTemplate = (rowData: ResellerWallet) => {
        return (
            <>
                <span className="p-column-title">{t('MENU.ACTIONS')}</span>
                <div className="flex gap-1">
                    <Button
                        icon="pi pi-plus-circle"
                        rounded
                        text
                        severity="success"
                        tooltip={t('WALLETS.ADD_BALANCE')}
                        onClick={() => {
                            setSelectedWallet(rowData);
                            setAddBalanceDialog(true);
                        }}
                    />
                    <Button
                        icon="pi pi-minus-circle"
                        rounded
                        text
                        severity="warning"
                        tooltip={t('WALLETS.DEDUCT_BALANCE')}
                        onClick={() => {
                            setSelectedWallet(rowData);
                            setDeductBalanceDialog(true);
                        }}
                    />
                    <Button
                        icon="pi pi-credit-card"
                        rounded
                        text
                        severity="info"
                        tooltip={t('WALLETS.ADD_PAYMENT')}
                        onClick={() => {
                            setSelectedWallet(rowData);
                            setAddPaymentDialog(true);
                        }}
                    />
                    <Button
                        icon="pi pi-money-bill"
                        rounded
                        text
                        severity="danger"
                        tooltip={t('WALLETS.DEDUCT_PAYMENT')}
                        onClick={() => {
                            setSelectedWallet(rowData);
                            setDeductPaymentDialog(true);
                        }}
                    />
                </div>
            </>
        );
    };

    const walletTypeBodyTemplate = (rowData: ResellerWallet) => {
        let typeText = '';
        let typeClass = '';

        if (rowData.is_current_active) {
            typeText = t('WALLETS.ACTIVE_WALLET');
            typeClass = 'bg-green-500';
        } else if (rowData.is_default) {
            typeText = t('WALLETS.DEFAULT_WALLET');
            typeClass = 'bg-blue-500';
        } else {
            typeText = t('WALLETS.SECONDARY_WALLET');
            typeClass = 'bg-gray-500';
        }

        return (
            <>
                <span className="p-column-title">{t('WALLETS.TYPE')}</span>
                <span className={`inline-block px-2 py-1 rounded text-white text-sm ${typeClass}`}>
                    {typeText}
                </span>
            </>
        );
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card p-2">
                    {loading && <ProgressBar mode="indeterminate" style={{ height: '6px' }} />}
                    <Toast ref={toast} />

                    <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate} />

                    {/* Reseller Info Card */}


                    <DataTable
                        value={resellerWallets?.wallets || []}
                        className="datatable-responsive"
                        responsiveLayout="scroll"
                        emptyMessage={t('DATA_TABLE.TABLE.NO_DATA')}
                        dir={isRTL() ? 'rtl' : 'ltr'}
                        style={{ direction: isRTL() ? 'rtl' : 'ltr' }}
                    >
                        <Column body={currencyBodyTemplate} header={t('WALLETS.CURRENCY')} style={{ minWidth: '120px' }} />
                        <Column body={balanceBodyTemplate} header={t('WALLETS.BALANCE')} style={{ minWidth: '120px' }} />
                        <Column body={paymentBodyTemplate} header={t('WALLETS.PAYMENT')} style={{ minWidth: '120px' }} />
                        <Column body={availableBalanceBodyTemplate} header={t('WALLETS.AVAILABLE_BALANCE')} style={{ minWidth: '140px' }} />
                        <Column body={walletTypeBodyTemplate} header={t('WALLETS.TYPE')} style={{ minWidth: '140px' }} />
                        <Column body={defaultBodyTemplate} header={t('WALLETS.IS_DEFAULT')} style={{ minWidth: '100px' }} />
                        <Column body={statusBodyTemplate} header={t('WALLETS.STATUS')} style={{ minWidth: '100px' }} />
                        <Column body={actionsBodyTemplate} header={t('ACTIONS')} style={{ minWidth: '200px' }} />
                    </DataTable>

                    {/* Add Balance Dialog */}
                    <Dialog
                        visible={addBalanceDialog}
                        header={t('WALLETS.ADD_BALANCE')}
                        onHide={() => {
                            setAddBalanceDialog(false);
                            setAmount('');
                            setSelectedWallet(null);
                        }}
                        style={{ width: '450px' }}
                        footer={
                            <div className="flex justify-content-between gap-2">
                                <Button
                                    label={t('APP.GENERAL.CANCEL')}
                                    icon="pi pi-times"
                                    severity="danger"
                                    onClick={() => {
                                        setAddBalanceDialog(false);
                                        setAmount('');
                                        setSelectedWallet(null);
                                    }}
                                />
                                <Button
                                    label={t('FORM.GENERAL.SUBMIT')}
                                    icon="pi pi-check"
                                    severity="success"
                                    onClick={handleAddBalance}
                                />
                            </div>
                        }
                    >
                        <div className="flex flex-column gap-3">
                            <div>
                                <label htmlFor="wallet" className="font-bold mb-2 block">
                                    {t('WALLETS.SELECTED_WALLET')}:
                                </label>
                                <InputText
                                    id="wallet"
                                    value={`${selectedWallet?.currency?.code || 'N/A'} - ${t('WALLETS.BALANCE')}: ${selectedWallet?.balance}`}
                                    disabled
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label htmlFor="amount" className="font-bold mb-2 block">
                                    {t('WALLETS.AMOUNT')}:
                                </label>
                                <InputText
                                    id="amount"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    type="number"
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </Dialog>

                    {/* Add Payment Dialog */}
                    <Dialog
                        visible={addPaymentDialog}
                        header={t('WALLETS.ADD_PAYMENT')}
                        onHide={() => {
                            setAddPaymentDialog(false);
                            setAmount('');
                            setSelectedWallet(null);
                        }}
                        style={{ width: '450px' }}
                        footer={
                            <div className="flex justify-content-between gap-2">
                                <Button
                                    label={t('APP.GENERAL.CANCEL')}
                                    icon="pi pi-times"
                                    severity="danger"
                                    onClick={() => {
                                        setAddPaymentDialog(false);
                                        setAmount('');
                                        setSelectedWallet(null);
                                    }}
                                />
                                <Button
                                    label={t('FORM.GENERAL.SUBMIT')}
                                    icon="pi pi-check"
                                    severity="success"
                                    onClick={handleAddPayment}
                                />
                            </div>
                        }
                    >
                        <div className="flex flex-column gap-3">
                            <div>
                                <label htmlFor="wallet" className="font-bold mb-2 block">
                                    {t('WALLETS.SELECTED_WALLET')}:
                                </label>
                                <InputText
                                    id="wallet"
                                    value={`${selectedWallet?.currency.code} - ${t('WALLETS.PAYMENT')}: ${selectedWallet?.payment}`}
                                    disabled
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label htmlFor="amount" className="font-bold mb-2 block">
                                    {t('WALLETS.AMOUNT')}:
                                </label>
                                <InputText
                                    id="amount"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    type="number"
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </Dialog>

                    {/* Deduct Balance Dialog */}
                    <Dialog
                        visible={deductBalanceDialog}
                        header={t('WALLETS.DEDUCT_BALANCE')}
                        onHide={() => {
                            setDeductBalanceDialog(false);
                            setAmount('');
                            setSelectedWallet(null);
                        }}
                        style={{ width: '450px' }}
                        footer={
                            <div className="flex justify-content-between gap-2">
                                <Button
                                    label={t('APP.GENERAL.CANCEL')}
                                    icon="pi pi-times"
                                    severity="danger"
                                    onClick={() => {
                                        setDeductBalanceDialog(false);
                                        setAmount('');
                                        setSelectedWallet(null);
                                    }}
                                />
                                <Button
                                    label={t('FORM.GENERAL.SUBMIT')}
                                    icon="pi pi-check"
                                    severity="success"
                                    onClick={handleDeductBalance}
                                />
                            </div>
                        }
                    >
                        <div className="flex flex-column gap-3">
                            <div>
                                <label htmlFor="wallet" className="font-bold mb-2 block">
                                    {t('WALLETS.SELECTED_WALLET')}:
                                </label>
                                <InputText
                                    id="wallet"
                                    value={`${selectedWallet?.currency.code} - ${t('WALLETS.BALANCE')}: ${selectedWallet?.balance}`}
                                    disabled
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label htmlFor="amount" className="font-bold mb-2 block">
                                    {t('WALLETS.AMOUNT')}:
                                </label>
                                <InputText
                                    id="amount"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    type="number"
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </Dialog>

                    {/* Deduct Payment Dialog */}
                    <Dialog
                        visible={deductPaymentDialog}
                        header={t('WALLETS.DEDUCT_PAYMENT')}
                        onHide={() => {
                            setDeductPaymentDialog(false);
                            setAmount('');
                            setSelectedWallet(null);
                        }}
                        style={{ width: '450px' }}
                        footer={
                            <div className="flex justify-content-between gap-2">
                                <Button
                                    label={t('APP.GENERAL.CANCEL')}
                                    icon="pi pi-times"
                                    severity="danger"
                                    onClick={() => {
                                        setDeductPaymentDialog(false);
                                        setAmount('');
                                        setSelectedWallet(null);
                                    }}
                                />
                                <Button
                                    label={t('FORM.GENERAL.SUBMIT')}
                                    icon="pi pi-check"
                                    severity="success"
                                    onClick={handleDeductPayment}
                                />
                            </div>
                        }
                    >
                        <div className="flex flex-column gap-3">
                            <div>
                                <label htmlFor="wallet" className="font-bold mb-2 block">
                                    {t('WALLETS.SELECTED_WALLET')}:
                                </label>
                                <InputText
                                    id="wallet"
                                    value={`${selectedWallet?.currency.code} - ${t('WALLETS.PAYMENT')}: ${selectedWallet?.payment}`}
                                    disabled
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label htmlFor="amount" className="font-bold mb-2 block">
                                    {t('WALLETS.AMOUNT')}:
                                </label>
                                <InputText
                                    id="amount"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    type="number"
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </Dialog>

                    {/* Create Wallet Dialog */}
                    <Dialog
                        visible={createWalletDialog}
                        header={t('WALLETS.CREATE_NEW_WALLET')}
                        onHide={() => {
                            setCreateWalletDialog(false);
                            setNewWalletData({
                                currency_code: '',
                                initial_balance: 0,
                                initial_payment: 0,
                                set_as_default: false,
                                set_as_active: true
                            });
                        }}
                        style={{ width: '500px' }}
                        footer={
                            <div className="flex justify-content-between gap-2">
                                <Button
                                    label={t('APP.GENERAL.CANCEL')}
                                    icon="pi pi-times"
                                    severity="danger"
                                    onClick={() => {
                                        setCreateWalletDialog(false);
                                        setNewWalletData({
                                            currency_code: '',
                                            initial_balance: 0,
                                            initial_payment: 0,
                                            set_as_default: false,
                                            set_as_active: true
                                        });
                                    }}
                                />
                                <Button
                                    label={t('FORM.GENERAL.SUBMIT')}
                                    icon="pi pi-check"
                                    severity="success"
                                    onClick={handleCreateWallet}
                                />
                            </div>
                        }
                    >
                        <div className="flex flex-column gap-3">
                            <div>
                                <label htmlFor="currency" className="font-bold mb-2 block">
                                    {t('WALLETS.CURRENCY')}:
                                </label>
                                <Dropdown
                                    id="currency"
                                    value={newWalletData.currency_code}
                                    options={currencies}
                                    onChange={(e) => setNewWalletData({ ...newWalletData, currency_code: e.value })}
                                    optionLabel="code"
                                    optionValue="code"
                                    placeholder={t('WALLETS.SELECT_CURRENCY')}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label htmlFor="initial_balance" className="font-bold mb-2 block">
                                    {t('WALLETS.INITIAL_BALANCE')}:
                                </label>
                                <InputText
                                    id="initial_balance"
                                    value={newWalletData.initial_balance.toString()}
                                    onChange={(e) => setNewWalletData({ ...newWalletData, initial_balance: parseFloat(e.target.value) || 0 })}
                                    type="number"
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label htmlFor="initial_payment" className="font-bold mb-2 block">
                                    {t('WALLETS.INITIAL_PAYMENT')}:
                                </label>
                                <InputText
                                    id="initial_payment"
                                    value={newWalletData.initial_payment.toString()}
                                    onChange={(e) => setNewWalletData({ ...newWalletData, initial_payment: parseFloat(e.target.value) || 0 })}
                                    type="number"
                                    className="w-full"
                                />
                            </div>
                            <div className="flex gap-3">
                                <div className="flex align-items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="set_as_default"
                                        checked={newWalletData.set_as_default}
                                        onChange={(e) => setNewWalletData({ ...newWalletData, set_as_default: e.target.checked })}
                                    />
                                    <label htmlFor="set_as_default">{t('WALLETS.SET_AS_DEFAULT')}</label>
                                </div>
                                <div className="flex align-items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="set_as_active"
                                        checked={newWalletData.set_as_active}
                                        onChange={(e) => setNewWalletData({ ...newWalletData, set_as_active: e.target.checked })}
                                    />
                                    <label htmlFor="set_as_active">{t('WALLETS.SET_AS_ACTIVE')}</label>
                                </div>
                            </div>
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default ResellerWallets;
