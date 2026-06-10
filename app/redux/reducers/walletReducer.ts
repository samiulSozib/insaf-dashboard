// reducers/walletReducer.ts - Fix the create wallet success handler

import {
    FETCH_RESELLER_WALLETS_REQUEST,
    FETCH_RESELLER_WALLETS_SUCCESS,
    FETCH_RESELLER_WALLETS_FAIL,
    FETCH_ALL_WALLETS_REQUEST,
    FETCH_ALL_WALLETS_SUCCESS,
    FETCH_ALL_WALLETS_FAIL,
    FETCH_WALLET_DETAILS_REQUEST,
    FETCH_WALLET_DETAILS_SUCCESS,
    FETCH_WALLET_DETAILS_FAIL,
    FETCH_WALLET_STATISTICS_REQUEST,
    FETCH_WALLET_STATISTICS_SUCCESS,
    FETCH_WALLET_STATISTICS_FAIL,
    CREATE_WALLET_REQUEST,
    CREATE_WALLET_SUCCESS,
    CREATE_WALLET_FAIL,
    ADD_BALANCE_REQUEST,
    ADD_BALANCE_SUCCESS,
    ADD_BALANCE_FAIL,
    ADD_PAYMENT_REQUEST,
    ADD_PAYMENT_SUCCESS,
    ADD_PAYMENT_FAIL,
    DEDUCT_BALANCE_REQUEST,
    DEDUCT_BALANCE_SUCCESS,
    DEDUCT_BALANCE_FAIL,
    DEDUCT_PAYMENT_REQUEST,
    DEDUCT_PAYMENT_SUCCESS,
    DEDUCT_PAYMENT_FAIL,
    SET_DEFAULT_WALLET_REQUEST,
    SET_DEFAULT_WALLET_SUCCESS,
    SET_DEFAULT_WALLET_FAIL,
    ACTIVATE_WALLET_REQUEST,
    ACTIVATE_WALLET_SUCCESS,
    ACTIVATE_WALLET_FAIL,
    DEACTIVATE_WALLET_REQUEST,
    DEACTIVATE_WALLET_SUCCESS,
    DEACTIVATE_WALLET_FAIL,
    TRANSFER_BETWEEN_WALLETS_REQUEST,
    TRANSFER_BETWEEN_WALLETS_SUCCESS,
    TRANSFER_BETWEEN_WALLETS_FAIL,
} from "../constants/walletConstants";
import { Pagination, ResellerWallet, Wallet, WalletDetails, WalletStatistics, Currency } from "@/types/interface";

interface WalletState {
    loading: boolean;
    error: string | null;
    resellerWallets: {
        reseller: {
            id: number;
            name: string;
            phone: string;
        } | null;
        wallets: ResellerWallet[];
        active_wallet: {
            wallet_id: number;
            currency_code: string;
        } | null;
    };
    allWallets: {
        data: Wallet[];
        pagination: Pagination | null;
        summary: {
            total_wallets: number;
            total_balance_usd: number;
            total_active_wallets: number;
            total_resellers: number;
        } | null;
    };
    walletDetails: WalletDetails | null;
    statistics: WalletStatistics | null;
}

const initialState: WalletState = {
    loading: false,
    error: null,
    resellerWallets: {
        reseller: null,
        wallets: [],
        active_wallet: null,
    },
    allWallets: {
        data: [],
        pagination: null,
        summary: null,
    },
    walletDetails: null,
    statistics: null,
};

// Helper function to create a minimal Currency object
const createMinimalCurrency = (code: string, symbol: string): Currency => {
    return {
        id: 0,
        code: code,
        symbol: symbol,
        name: code,
        ignore_digits_count: '0',
        exchange_rate_per_usd: '1',
        deleted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
};

// Helper function to format wallet from API response
const formatWalletFromApi = (walletData: any, existingWallets: ResellerWallet[] = []): ResellerWallet => {
    // Try to find existing currency from other wallets
    let currency: Currency;

    if (walletData.currency) {
        currency = walletData.currency;
    } else if (walletData.currency_code) {
        const existingCurrency = existingWallets.find(
            w => w.currency.code === walletData.currency_code
        )?.currency;

        if (existingCurrency) {
            currency = existingCurrency;
        } else {
            currency = createMinimalCurrency(walletData.currency_code, walletData.currency_code);
        }
    } else {
        currency = createMinimalCurrency('Unknown', '?');
    }

    return {
        wallet_id: walletData.id || walletData.wallet_id,
        currency: currency,
        balance: walletData.balance || '0',
        payment: walletData.payment || '0',
        loan_balance: walletData.loan_balance || '0',
        available_balance: walletData.available_balance || walletData.balance || '0',
        total_earnings: walletData.total_earnings || '0',
        total_hawala_sent: walletData.total_hawala_sent || '0',
        total_hawala_received: walletData.total_hawala_received || '0',
        is_default: walletData.is_default || false,
        is_active: walletData.is_active !== undefined ? walletData.is_active : true,
        is_current_active: walletData.is_current_active || false
    };
};

// Helper function to ensure WalletDetails has all required properties
const ensureWalletDetails = (data: any): WalletDetails => {
    return {
        id: data.id || 0,
        reseller: data.reseller || { id: 0, name: '', phone: '' },
        currency: data.currency || createMinimalCurrency('Unknown', '?'),
        balance: data.balance || '0',
        payment: data.payment || '0',
        loan_balance: data.loan_balance || '0',
        available_balance: data.available_balance || '0',
        total_earnings: data.total_earnings || '0',
        total_hawala_sent: data.total_hawala_sent || '0',
        total_hawala_received: data.total_hawala_received || '0',
        is_default: data.is_default || false,
        is_active: data.is_active || false,
        created_at: data.created_at || new Date().toISOString(),
    };
};

export const walletReducer = (state = initialState, action: any): WalletState => {
    switch (action.type) {
        case FETCH_RESELLER_WALLETS_REQUEST:
        case FETCH_ALL_WALLETS_REQUEST:
        case FETCH_WALLET_DETAILS_REQUEST:
        case FETCH_WALLET_STATISTICS_REQUEST:
        case CREATE_WALLET_REQUEST:
        case ADD_BALANCE_REQUEST:
        case ADD_PAYMENT_REQUEST:
        case DEDUCT_BALANCE_REQUEST:
        case DEDUCT_PAYMENT_REQUEST:
        case SET_DEFAULT_WALLET_REQUEST:
        case ACTIVATE_WALLET_REQUEST:
        case DEACTIVATE_WALLET_REQUEST:
        case TRANSFER_BETWEEN_WALLETS_REQUEST:
            return {
                ...state,
                loading: true,
                error: null,
            };

        case FETCH_RESELLER_WALLETS_SUCCESS:
            return {
                ...state,
                loading: false,
                resellerWallets: {
                    reseller: action.payload.reseller || null,
                    wallets: action.payload.wallets || [],
                    active_wallet: action.payload.active_wallet || null,
                },
                error: null,
            };

        case FETCH_ALL_WALLETS_SUCCESS:
            return {
                ...state,
                loading: false,
                allWallets: {
                    data: action.payload.data || [],
                    pagination: action.payload.pagination || null,
                    summary: action.payload.summary || null,
                },
                error: null,
            };

        case FETCH_WALLET_DETAILS_SUCCESS:
            return {
                ...state,
                loading: false,
                walletDetails: ensureWalletDetails(action.payload),
                error: null,
            };

        case FETCH_WALLET_STATISTICS_SUCCESS:
            return {
                ...state,
                loading: false,
                statistics: action.payload,
                error: null,
            };

        case CREATE_WALLET_SUCCESS: {
            let newWallet: ResellerWallet;

            if (action.payload.wallet) {
                const walletFromApi = action.payload.wallet;
                newWallet = formatWalletFromApi(walletFromApi, state.resellerWallets.wallets);
            } else {
                newWallet = formatWalletFromApi(action.payload, state.resellerWallets.wallets);
            }

            return {
                ...state,
                loading: false,
                resellerWallets: {
                    ...state.resellerWallets,
                    wallets: [...state.resellerWallets.wallets, newWallet],
                },
                error: null,
            };
        }

        case ADD_BALANCE_SUCCESS: {
            const newBalance = action.payload.newBalance || action.payload.wallet?.new_balance || '0';
            const walletId = action.payload.walletId || action.payload.wallet?.id;

            return {
                ...state,
                loading: false,
                resellerWallets: {
                    ...state.resellerWallets,
                    wallets: state.resellerWallets.wallets.map((wallet) =>
                        wallet.wallet_id === walletId
                            ? {
                                ...wallet,
                                balance: newBalance,
                                available_balance: newBalance
                              }
                            : wallet
                    ),
                },
                allWallets: {
                    ...state.allWallets,
                    data: state.allWallets.data.map((wallet) =>
                        wallet.id === walletId
                            ? { ...wallet, balance: newBalance }
                            : wallet
                    ),
                },
                walletDetails: state.walletDetails && state.walletDetails.id === walletId
                    ? {
                        ...state.walletDetails,
                        balance: newBalance,
                        available_balance: newBalance
                      }
                    : state.walletDetails,
                error: null,
            };
        }

        case DEDUCT_BALANCE_SUCCESS: {
            const newBalance = action.payload.newBalance || action.payload.wallet?.new_balance || '0';
            const walletId = action.payload.walletId || action.payload.wallet?.id;

            return {
                ...state,
                loading: false,
                resellerWallets: {
                    ...state.resellerWallets,
                    wallets: state.resellerWallets.wallets.map((wallet) =>
                        wallet.wallet_id === walletId
                            ? {
                                ...wallet,
                                balance: newBalance,
                                available_balance: newBalance
                              }
                            : wallet
                    ),
                },
                allWallets: {
                    ...state.allWallets,
                    data: state.allWallets.data.map((wallet) =>
                        wallet.id === walletId
                            ? { ...wallet, balance: newBalance }
                            : wallet
                    ),
                },
                walletDetails: state.walletDetails && state.walletDetails.id === walletId
                    ? {
                        ...state.walletDetails,
                        balance: newBalance,
                        available_balance: newBalance
                      }
                    : state.walletDetails,
                error: null,
            };
        }

        case ADD_PAYMENT_SUCCESS:
            return {
                ...state,
                loading: false,
                resellerWallets: {
                    ...state.resellerWallets,
                    wallets: state.resellerWallets.wallets.map((wallet) =>
                        wallet.wallet_id === action.payload.walletId
                            ? { ...wallet, payment: action.payload.newPayment }
                            : wallet
                    ),
                },
                allWallets: {
                    ...state.allWallets,
                    data: state.allWallets.data.map((wallet) =>
                        wallet.id === action.payload.walletId
                            ? { ...wallet, payment: action.payload.newPayment }
                            : wallet
                    ),
                },
                walletDetails: state.walletDetails && state.walletDetails.id === action.payload.walletId
                    ? { ...state.walletDetails, payment: action.payload.newPayment }
                    : state.walletDetails,
                error: null,
            };

        case DEDUCT_PAYMENT_SUCCESS:
            return {
                ...state,
                loading: false,
                resellerWallets: {
                    ...state.resellerWallets,
                    wallets: state.resellerWallets.wallets.map((wallet) =>
                        wallet.wallet_id === action.payload.walletId
                            ? { ...wallet, payment: action.payload.newPayment }
                            : wallet
                    ),
                },
                allWallets: {
                    ...state.allWallets,
                    data: state.allWallets.data.map((wallet) =>
                        wallet.id === action.payload.walletId
                            ? { ...wallet, payment: action.payload.newPayment }
                            : wallet
                    ),
                },
                walletDetails: state.walletDetails && state.walletDetails.id === action.payload.walletId
                    ? { ...state.walletDetails, payment: action.payload.newPayment }
                    : state.walletDetails,
                error: null,
            };

        case SET_DEFAULT_WALLET_SUCCESS:
            return {
                ...state,
                loading: false,
                resellerWallets: {
                    ...state.resellerWallets,
                    wallets: state.resellerWallets.wallets.map((wallet) => ({
                        ...wallet,
                        is_default: wallet.wallet_id === action.payload.walletId,
                    })),
                    active_wallet: {
                        wallet_id: action.payload.walletId,
                        currency_code: state.resellerWallets.wallets.find(
                            (w) => w.wallet_id === action.payload.walletId
                        )?.currency.code || '',
                    },
                },
                error: null,
            };

        case ACTIVATE_WALLET_SUCCESS:
            return {
                ...state,
                loading: false,
                resellerWallets: {
                    ...state.resellerWallets,
                    wallets: state.resellerWallets.wallets.map((wallet) =>
                        wallet.wallet_id === action.payload
                            ? { ...wallet, is_active: true }
                            : wallet
                    ),
                },
                allWallets: {
                    ...state.allWallets,
                    data: state.allWallets.data.map((wallet) =>
                        wallet.id === action.payload
                            ? { ...wallet, is_active: true }
                            : wallet
                    ),
                },
                walletDetails: state.walletDetails && state.walletDetails.id === action.payload
                    ? { ...state.walletDetails, is_active: true }
                    : state.walletDetails,
                error: null,
            };

        case DEACTIVATE_WALLET_SUCCESS:
            return {
                ...state,
                loading: false,
                resellerWallets: {
                    ...state.resellerWallets,
                    wallets: state.resellerWallets.wallets.map((wallet) =>
                        wallet.wallet_id === action.payload
                            ? { ...wallet, is_active: false }
                            : wallet
                    ),
                },
                allWallets: {
                    ...state.allWallets,
                    data: state.allWallets.data.map((wallet) =>
                        wallet.id === action.payload
                            ? { ...wallet, is_active: false }
                            : wallet
                    ),
                },
                walletDetails: state.walletDetails && state.walletDetails.id === action.payload
                    ? { ...state.walletDetails, is_active: false }
                    : state.walletDetails,
                error: null,
            };

        case TRANSFER_BETWEEN_WALLETS_SUCCESS:
            return {
                ...state,
                loading: false,
                error: null,
            };

        case FETCH_RESELLER_WALLETS_FAIL:
        case FETCH_ALL_WALLETS_FAIL:
        case FETCH_WALLET_DETAILS_FAIL:
        case FETCH_WALLET_STATISTICS_FAIL:
        case CREATE_WALLET_FAIL:
        case ADD_BALANCE_FAIL:
        case ADD_PAYMENT_FAIL:
        case DEDUCT_BALANCE_FAIL:
        case DEDUCT_PAYMENT_FAIL:
        case SET_DEFAULT_WALLET_FAIL:
        case ACTIVATE_WALLET_FAIL:
        case DEACTIVATE_WALLET_FAIL:
        case TRANSFER_BETWEEN_WALLETS_FAIL:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };

        default:
            return state;
    }
};
