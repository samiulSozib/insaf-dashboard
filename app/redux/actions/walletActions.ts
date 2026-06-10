import axios from "axios";
import { Dispatch } from "redux";
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
import { Toast } from "primereact/toast";
import { CreateWalletData, TransferWalletData } from "@/types/interface";
import Swal from "sweetalert2";

const getAuthToken = () => {
    return localStorage.getItem("api_token") || "";
};

// Fetch Reseller Wallets (by reseller ID)
export const _fetchResellerWallets = (
    resellerId: number,
    toast?: React.RefObject<Toast>,
    t?: (key: string) => string
) => async (dispatch: Dispatch) => {
    dispatch({ type: FETCH_RESELLER_WALLETS_REQUEST });

    try {
        const token = getAuthToken();
        const response = await axios.get(
            `${process.env.NEXT_PUBLIC_BASE_URL}/resellers/${resellerId}/wallets`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        dispatch({
            type: FETCH_RESELLER_WALLETS_SUCCESS,
            payload: response.data.data,
        });

        if (toast && t) {
            toast.current?.show({
                severity: "success",
                summary: t("SUCCESS"),
                detail: t("WALLETS_FETCHED_SUCCESS"),
                life: 3000,
            });
        }
    } catch (error: any) {
        dispatch({
            type: FETCH_RESELLER_WALLETS_FAIL,
            payload: error.response?.data?.message || error.message,
        });

        if (toast && t) {
            toast.current?.show({
                severity: "error",
                summary: t("ERROR"),
                detail: error.response?.data?.message || t("WALLETS_FETCH_FAILED"),
                life: 3000,
            });
        }
    }
};

// Fetch All Wallets (with pagination)
export const _fetchAllWallets = (
    page: number = 1,
    items_per_page: number = 20,
    search: string = '',
    filters: any = {}
) => async (dispatch: Dispatch) => {
    dispatch({ type: FETCH_ALL_WALLETS_REQUEST });

    try {
        const token = getAuthToken();
        const queryParams = new URLSearchParams();

        queryParams.append('items_per_page', items_per_page.toString());
        queryParams.append('page', page.toString());

        if (search) {
            queryParams.append('search', search);
        }

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                queryParams.append(key, String(value));
            }
        });

        const queryString = queryParams.toString();
        const response = await axios.get(
            `${process.env.NEXT_PUBLIC_BASE_URL}/wallets?${queryString}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        dispatch({
            type: FETCH_ALL_WALLETS_SUCCESS,
            payload: {
                data: response.data.data.wallets,
                pagination: response.data.payload.pagination,
                summary: response.data.data.summary,
            }
        });
    } catch (error: any) {
        dispatch({
            type: FETCH_ALL_WALLETS_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

// actions/walletActions.ts - Update the fetch wallet details action

// Fetch Wallet Details
export const _fetchWalletDetails = (walletId: number, toast?: React.RefObject<Toast>, t?: (key: string) => string) => async (dispatch: Dispatch) => {
    dispatch({ type: FETCH_WALLET_DETAILS_REQUEST });

    try {
        const token = getAuthToken();
        const response = await axios.get(
            `${process.env.NEXT_PUBLIC_BASE_URL}/wallets/${walletId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        // Ensure the payload has all required fields
        const walletData = response.data.data.wallet;
        const formattedWalletData = {
            id: walletData.id,
            reseller: walletData.reseller,
            currency: walletData.currency,
            balance: walletData.balance,
            payment: walletData.payment,
            loan_balance: walletData.loan_balance,
            available_balance: walletData.available_balance,
            total_earnings: walletData.total_earnings || '0',
            total_hawala_sent: walletData.total_hawala_sent || '0',
            total_hawala_received: walletData.total_hawala_received || '0',
            is_default: walletData.is_default,
            is_active: walletData.is_active,
            created_at: walletData.created_at,
        };

        dispatch({
            type: FETCH_WALLET_DETAILS_SUCCESS,
            payload: formattedWalletData,
        });

        if (toast && t) {
            toast.current?.show({
                severity: "success",
                summary: t("SUCCESS"),
                detail: t("WALLET_DETAILS_FETCHED"),
                life: 3000,
            });
        }
    } catch (error: any) {
        dispatch({
            type: FETCH_WALLET_DETAILS_FAIL,
            payload: error.response?.data?.message || error.message,
        });

        if (toast && t) {
            toast.current?.show({
                severity: "error",
                summary: t("ERROR"),
                detail: error.response?.data?.message || t("WALLET_DETAILS_FETCH_FAILED"),
                life: 3000,
            });
        }
    }
};

// Fetch Wallet Statistics
export const _fetchWalletStatistics = () => async (dispatch: Dispatch) => {
    dispatch({ type: FETCH_WALLET_STATISTICS_REQUEST });

    try {
        const token = getAuthToken();
        const response = await axios.get(
            `${process.env.NEXT_PUBLIC_BASE_URL}/wallets/statistics`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        dispatch({
            type: FETCH_WALLET_STATISTICS_SUCCESS,
            payload: response.data.data,
        });
    } catch (error: any) {
        dispatch({
            type: FETCH_WALLET_STATISTICS_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

// Update these action creators in your walletActions.ts file:

// Create Wallet for Reseller
export const _createWallet = (
    resellerId: number,
    walletData: CreateWalletData,
    toast: React.RefObject<Toast>,
    t: (key: string) => string
) => async (dispatch: Dispatch) => {
    dispatch({ type: CREATE_WALLET_REQUEST });

    try {
        const token = getAuthToken();
        const response = await axios.post(
            `${process.env.NEXT_PUBLIC_BASE_URL}/resellers/${resellerId}/wallets`,
            walletData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        // Dispatch the entire response data
        dispatch({
            type: CREATE_WALLET_SUCCESS,
            payload: response.data.data, // This contains { wallet: { id, currency_code, balance, payment, is_default } }
        });

        toast.current?.show({
            severity: "success",
            summary: t("SUCCESS"),
            detail: t("WALLET_CREATED_SUCCESS"),
            life: 3000,
        });

        // Refetch wallets to get updated list
        //dispatch(_fetchResellerWallets(resellerId, toast, t));

    } catch (error: any) {
        dispatch({
            type: CREATE_WALLET_FAIL,
            payload: error.response?.data?.message || error.message,
        });

        let errorMessage = t("WALLET_CREATE_FAILED");
        if (error.response?.status === 422 && error.response.data?.errors) {
            const errorMessages = Object.values(error.response.data.errors)
                .flat()
                .join(', ');
            errorMessage = errorMessages || t("VALIDATION_FAILED");
        } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        }

        toast.current?.show({
            severity: "error",
            summary: t("ERROR"),
            detail: errorMessage,
            life: 3000,
        });
    }
};

// Add Balance to Wallet
export const _addBalanceToWallet = (
    walletId: number,
    amount: number,
    toast: React.RefObject<Toast>,
    t: (key: string) => string
) => async (dispatch: Dispatch) => {
    dispatch({ type: ADD_BALANCE_REQUEST });

    try {
        const token = getAuthToken();
        const formData = new FormData();
        formData.append('amount', amount.toString());

        const response = await axios.post(
            `${process.env.NEXT_PUBLIC_BASE_URL}/wallets/${walletId}/add-balance`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        // Handle response structure: { data: { wallet: { id, new_balance, amount_added } } }
        const walletData = response.data.data.wallet;

        dispatch({
            type: ADD_BALANCE_SUCCESS,
            payload: {
                walletId: walletData.id,
                newBalance: walletData.new_balance
            },
        });

        toast.current?.show({
            severity: "success",
            summary: t("SUCCESS"),
            detail: t("BALANCE_ADDED_SUCCESS"),
            life: 3000,
        });
    } catch (error: any) {
        dispatch({
            type: ADD_BALANCE_FAIL,
            payload: error.response?.data?.message || error.message,
        });

        toast.current?.show({
            severity: "error",
            summary: t("ERROR"),
            detail: error.response?.data?.message || t("BALANCE_ADD_FAILED"),
            life: 3000,
        });
    }
};

// Deduct Balance from Wallet
export const _deductBalanceFromWallet = (
    walletId: number,
    amount: number,
    toast: React.RefObject<Toast>,
    t: (key: string) => string
) => async (dispatch: Dispatch) => {
    dispatch({ type: DEDUCT_BALANCE_REQUEST });

    try {
        const token = getAuthToken();
        const response = await axios.post(
            `${process.env.NEXT_PUBLIC_BASE_URL}/wallets/${walletId}/deduct-balance?amount=${amount}`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        // Handle response structure: { data: { wallet: { id, new_balance, amount_deducted } } }
        const walletData = response.data.data.wallet;

        dispatch({
            type: DEDUCT_BALANCE_SUCCESS,
            payload: {
                walletId: walletData.id,
                newBalance: walletData.new_balance
            },
        });

        toast.current?.show({
            severity: "success",
            summary: t("SUCCESS"),
            detail: t("BALANCE_DEDUCTED_SUCCESS"),
            life: 3000,
        });
    } catch (error: any) {
        dispatch({
            type: DEDUCT_BALANCE_FAIL,
            payload: error.response?.data?.message || error.message,
        });

        toast.current?.show({
            severity: "error",
            summary: t("ERROR"),
            detail: error.response?.data?.message || t("BALANCE_DEDUCT_FAILED"),
            life: 3000,
        });
    }
};

// Add Payment to Wallet
export const _addPaymentToWallet = (
    walletId: number,
    amount: number,
    toast: React.RefObject<Toast>,
    t: (key: string) => string
) => async (dispatch: Dispatch) => {
    dispatch({ type: ADD_PAYMENT_REQUEST });

    try {
        const token = getAuthToken();
        const response = await axios.post(
            `${process.env.NEXT_PUBLIC_BASE_URL}/wallets/${walletId}/add-payment?amount=${amount}`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        dispatch({
            type: ADD_PAYMENT_SUCCESS,
            payload: { walletId, newPayment: response.data.data.payment },
        });

        toast.current?.show({
            severity: "success",
            summary: t("SUCCESS"),
            detail: t("PAYMENT_ADDED_SUCCESS"),
            life: 3000,
        });
    } catch (error: any) {
        dispatch({
            type: ADD_PAYMENT_FAIL,
            payload: error.response?.data?.message || error.message,
        });

        toast.current?.show({
            severity: "error",
            summary: t("ERROR"),
            detail: error.response?.data?.message || t("PAYMENT_ADD_FAILED"),
            life: 3000,
        });
    }
};



// Deduct Payment from Wallet
export const _deductPaymentFromWallet = (
    walletId: number,
    amount: number,
    toast: React.RefObject<Toast>,
    t: (key: string) => string
) => async (dispatch: Dispatch) => {
    dispatch({ type: DEDUCT_PAYMENT_REQUEST });

    try {
        const token = getAuthToken();
        const response = await axios.post(
            `${process.env.NEXT_PUBLIC_BASE_URL}/wallets/${walletId}/deduct-payment?amount=${amount}`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        dispatch({
            type: DEDUCT_PAYMENT_SUCCESS,
            payload: { walletId, newPayment: response.data.data.payment },
        });

        toast.current?.show({
            severity: "success",
            summary: t("SUCCESS"),
            detail: t("PAYMENT_DEDUCTED_SUCCESS"),
            life: 3000,
        });
    } catch (error: any) {
        dispatch({
            type: DEDUCT_PAYMENT_FAIL,
            payload: error.response?.data?.message || error.message,
        });

        toast.current?.show({
            severity: "error",
            summary: t("ERROR"),
            detail: error.response?.data?.message || t("PAYMENT_DEDUCT_FAILED"),
            life: 3000,
        });
    }
};

// Set Wallet as Default
export const _setDefaultWallet = (
    walletId: number,
    toast: React.RefObject<Toast>,
    t: (key: string) => string
) => async (dispatch: Dispatch) => {
    dispatch({ type: SET_DEFAULT_WALLET_REQUEST });

    try {
        const token = getAuthToken();
        const response = await axios.post(
            `${process.env.NEXT_PUBLIC_BASE_URL}/wallets/set-default`,
            { wallet_id: walletId },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        dispatch({
            type: SET_DEFAULT_WALLET_SUCCESS,
            payload: { walletId, resellerId: response.data.data.reseller_id },
        });

        toast.current?.show({
            severity: "success",
            summary: t("SUCCESS"),
            detail: t("DEFAULT_WALLET_SET_SUCCESS"),
            life: 3000,
        });
    } catch (error: any) {
        dispatch({
            type: SET_DEFAULT_WALLET_FAIL,
            payload: error.response?.data?.message || error.message,
        });

        toast.current?.show({
            severity: "error",
            summary: t("ERROR"),
            detail: error.response?.data?.message || t("DEFAULT_WALLET_SET_FAILED"),
            life: 3000,
        });
    }
};

// Activate Wallet
export const _activateWallet = (
    walletId: number,
    toast: React.RefObject<Toast>,
    t: (key: string) => string
) => async (dispatch: Dispatch) => {
    dispatch({ type: ACTIVATE_WALLET_REQUEST });

    try {
        const token = getAuthToken();
        const response = await axios.post(
            `${process.env.NEXT_PUBLIC_BASE_URL}/wallets/${walletId}/activate`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        dispatch({
            type: ACTIVATE_WALLET_SUCCESS,
            payload: walletId,
        });

        toast.current?.show({
            severity: "success",
            summary: t("SUCCESS"),
            detail: t("WALLET_ACTIVATED_SUCCESS"),
            life: 3000,
        });
    } catch (error: any) {
        dispatch({
            type: ACTIVATE_WALLET_FAIL,
            payload: error.response?.data?.message || error.message,
        });

        toast.current?.show({
            severity: "error",
            summary: t("ERROR"),
            detail: error.response?.data?.message || t("WALLET_ACTIVATE_FAILED"),
            life: 3000,
        });
    }
};

// Deactivate Wallet
export const _deactivateWallet = (
    walletId: number,
    toast: React.RefObject<Toast>,
    t: (key: string) => string
) => async (dispatch: Dispatch) => {
    dispatch({ type: DEACTIVATE_WALLET_REQUEST });

    try {
        const token = getAuthToken();
        const response = await axios.post(
            `${process.env.NEXT_PUBLIC_BASE_URL}/wallets/${walletId}/deactivate`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        dispatch({
            type: DEACTIVATE_WALLET_SUCCESS,
            payload: walletId,
        });

        toast.current?.show({
            severity: "success",
            summary: t("SUCCESS"),
            detail: t("WALLET_DEACTIVATED_SUCCESS"),
            life: 3000,
        });
    } catch (error: any) {
        dispatch({
            type: DEACTIVATE_WALLET_FAIL,
            payload: error.response?.data?.message || error.message,
        });

        toast.current?.show({
            severity: "error",
            summary: t("ERROR"),
            detail: error.response?.data?.message || t("WALLET_DEACTIVATE_FAILED"),
            life: 3000,
        });
    }
};

// Transfer Between Wallets
export const _transferBetweenWallets = (
    transferData: TransferWalletData,
    toast: React.RefObject<Toast>,
    t: (key: string) => string
) => async (dispatch: Dispatch) => {
    dispatch({ type: TRANSFER_BETWEEN_WALLETS_REQUEST });

    try {
        const token = getAuthToken();
        const response = await axios.post(
            `${process.env.NEXT_PUBLIC_BASE_URL}/wallets/transfer`,
            transferData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        dispatch({
            type: TRANSFER_BETWEEN_WALLETS_SUCCESS,
            payload: response.data.data,
        });

        Swal.fire({
            title: t("SUCCESS"),
            text: t("TRANSFER_SUCCESS"),
            icon: "success"
        });
    } catch (error: any) {
        dispatch({
            type: TRANSFER_BETWEEN_WALLETS_FAIL,
            payload: error.response?.data?.message || error.message,
        });

        Swal.fire({
            title: t("ERROR"),
            text: error.response?.data?.message || t("TRANSFER_FAILED"),
            icon: "error"
        });
    }
};
