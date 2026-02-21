import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/button';
import { Globe } from 'lucide-react';

const LanguageToggle = ({ className = '', variant = 'outline', size = 'sm' }) => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleLanguage}
      className={`flex items-center gap-1 ${className}`}
      data-testid="language-toggle"
    >
      <Globe className="w-4 h-4" />
      <span className="font-medium">{language === 'id' ? 'ID' : 'EN'}</span>
    </Button>
  );
};

export default LanguageToggle;
