import requests
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class CurrencyService:
    def __init__(self):
        # In-memory cache for exchange rates.
        # Format: { "BASE_CURRENCY": { "timestamp": datetime, "rates": { "USD": 0.08, "EUR": 0.07, ... } } }
        self._cache = {}
        self._cache_duration = timedelta(hours=1) # Cache rates for 1 hour

    def get_exchange_rate(self, base_currency: str, target_currency: str) -> float:
        """
        Returns the exchange rate to convert from `target_currency` to `base_currency`.
        Because the API gives rates FROM the base currency (e.g. 1 base = X target),
        we look up the target_currency in the base_currency's rate table and divide.
        
        Example: 
        Base: GHS, Target: USD. 
        API for GHS returns rates["USD"] = 0.085 (1 GHS = 0.085 USD).
        To convert 100 USD to GHS: 100 / 0.085 = 1176.47 GHS.
        So the exchange rate from USD to GHS is 1 / 0.085.
        
        If base_currency == target_currency, returns 1.0.
        """
        base_currency = base_currency.upper()
        target_currency = target_currency.upper()

        if base_currency == target_currency:
            return 1.0

        rates = self._get_rates(base_currency)
        if not rates:
            logger.warning(f"Failed to fetch rates for {base_currency}. Falling back to 1.0")
            return 1.0

        if target_currency not in rates:
            logger.warning(f"Currency {target_currency} not found in {base_currency} rates. Falling back to 1.0")
            return 1.0

        # API returns how much 1 unit of base_currency is in target_currency.
        rate = rates[target_currency]
        
        # We want the multiplier to convert target -> base.
        # multiplier = 1 / rate
        return 1.0 / rate

    def _get_rates(self, base_currency: str) -> dict:
        now = datetime.now()
        
        # Check cache
        if base_currency in self._cache:
            cache_entry = self._cache[base_currency]
            if now - cache_entry['timestamp'] < self._cache_duration:
                return cache_entry['rates']

        # Fetch from API
        try:
            url = f"https://api.exchangerate-api.com/v4/latest/{base_currency}"
            response = requests.get(url, timeout=5)
            response.raise_for_status()
            data = response.json()
            
            rates = data.get('rates', {})
            if rates:
                self._cache[base_currency] = {
                    'timestamp': now,
                    'rates': rates
                }
                return rates
        except Exception as e:
            logger.error(f"Error fetching exchange rates for {base_currency}: {e}")
            
        return {}

# Singleton instance
currency_service = CurrencyService()
