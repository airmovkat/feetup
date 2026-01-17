import { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

const EXCHANGE_RATE = 300; // 1 USD = 300 LKR (Approximate)

export const CurrencyProvider = ({ children }) => {
    // Default to LKR, persist in localStorage
    const [currency, setCurrency] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('currency') || 'LKR';
        }
        return 'LKR';
    });

    const [exchangeRate, setExchangeRate] = useState(300); // Default fallback

    useEffect(() => {
        localStorage.setItem('currency', currency);
    }, [currency]);

    // Fetch Live Exchange Rate
    useEffect(() => {
        const fetchRate = async () => {
            try {
                const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
                const data = await response.json();
                if (data && data.rates && data.rates.LKR) {
                    setExchangeRate(data.rates.LKR);
                    console.log('Live Exchange Rate Fetched:', data.rates.LKR);
                }
            } catch (error) {
                console.error('Failed to fetch exchange rate, using fallback:', error);
            }
        };

        fetchRate();
    }, []);

    const toggleCurrency = (newCurrency) => {
        setCurrency(newCurrency);
    };

    const formatPrice = (priceInUSD) => {
        // Safety check: ensure price is a number
        const numericPrice = Number(priceInUSD);
        if (isNaN(numericPrice)) return '$0.00';

        if (currency === 'LKR') {
            const priceInLKR = numericPrice * exchangeRate;
            // Use standard localized formatting for currency
            return `Rs. ${priceInLKR.toLocaleString('en-LK', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
        }
        return `$ ${numericPrice.toFixed(2)}`;
    };

    const value = {
        currency,
        toggleCurrency,
        formatPrice,
        exchangeRate // Expose the dynamic rate
    };

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => useContext(CurrencyContext);
