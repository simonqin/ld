import { type FC } from 'react';
import useHealth from '../../hooks/health/useHealth';
import { useApplyPreferredLanguage } from '../../hooks/i18n/useApplyPreferredLanguage';
import useUser from '../../hooks/user/useUser';
import AppProviderContext from './context';

const AppProvider: FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const health = useHealth();
    const user = useUser(!!health?.data?.isAuthenticated);

    useApplyPreferredLanguage(user.data?.preferredLanguage);

    const value = {
        health,
        user,
    };

    return (
        <AppProviderContext.Provider value={value}>
            {children}
        </AppProviderContext.Provider>
    );
};

export default AppProvider;
