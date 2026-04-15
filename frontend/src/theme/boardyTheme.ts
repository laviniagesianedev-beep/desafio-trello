import type { ThemeConfig } from 'antd';

export const boardyTheme: ThemeConfig = {
  token: {
    // Cores primárias
    colorPrimary: '#A8D8EA',           // Azul pastel
    colorSuccess: '#A8E6CF',           // Verde pastel
    colorWarning: '#FFD3B6',           // Laranja pastel
    colorError: '#FFAAA5',             // Vermelho pastel
    colorInfo: '#A8D8EA',              // Azul pastel
    
    // Cores de fundo
    colorBgContainer: '#FFFFFF',
    colorBgElevated: '#FFFFFF',
    colorBgLayout: '#FAFAFA',
    colorBgSpotlight: '#F5F5F5',
    
    // Cores de texto
    colorText: '#2C3E50',
    colorTextSecondary: '#7F8C8D',
    colorTextTertiary: '#BDC3C7',
    colorTextQuaternary: '#EEEEEE',
    
    // Bordas
    colorBorder: '#E0E0E0',
    colorBorderSecondary: '#F0F0F0',
    
    // Bordas arredondadas
    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 8,
    borderRadiusXS: 4,
    
    // Sombras
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    boxShadowTertiary: '0 4px 16px rgba(0,0,0,0.08)',
    boxShadowSecondary: '0 8px 24px rgba(0,0,0,0.12)',
    
    // Tipografia
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeSM: 12,
    fontSizeXL: 20,
    fontSizeHeading1: 32,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    fontSizeHeading4: 18,
    fontSizeHeading5: 16,
    
    // Espaçamentos
    margin: 16,
    marginLG: 24,
    marginMD: 20,
    marginSM: 12,
    marginXS: 8,
    marginXXS: 4,
    
    padding: 16,
    paddingLG: 24,
    paddingMD: 20,
    paddingSM: 12,
    paddingXS: 8,
    paddingXXS: 4,
    
    // Alturas
    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,
    
    // Cores de linkage
    colorLink: '#A8D8EA',
    colorLinkHover: '#8EC5D9',
    colorLinkActive: '#6BB3C9',
  },
  components: {
    Button: {
      colorPrimary: '#A8D8EA',
      colorPrimaryHover: '#8EC5D9',
      colorPrimaryActive: '#6BB3C9',
      colorPrimaryBorder: '#A8D8EA',
      borderRadius: 12,
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      fontWeight: 500,
      defaultBg: '#FFFFFF',
      defaultColor: '#2C3E50',
      defaultBorderColor: '#E0E0E0',
      defaultHoverBg: '#F5F5F5',
      defaultHoverColor: '#2C3E50',
      defaultHoverBorderColor: '#A8D8EA',
    },
    Input: {
      colorBgContainer: '#FFFFFF',
      colorBorder: '#E0E0E0',
      colorPrimaryBorderHover: '#A8D8EA',
      colorPrimaryBorder: '#A8D8EA',
      colorText: '#2C3E50',
      colorTextPlaceholder: '#BDC3C7',
      borderRadius: 12,
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      paddingInline: 16,
    },
    Card: {
      colorBgContainer: '#FFFFFF',
      colorBorderSecondary: '#F0F0F0',
      borderRadiusLG: 16,
      boxShadowTertiary: '0 4px 12px rgba(0,0,0,0.05)',
      headerBg: 'transparent',
      actionsBg: 'transparent',
      actionsLiMargin: '12px 0',
    },
    Modal: {
      colorBgElevated: '#FFFFFF',
      borderRadiusLG: 20,
      paddingContentHorizontal: 24,
      paddingContentVertical: 16,
    },
    Tabs: {
      colorBgContainer: 'transparent',
      cardBg: '#F5F5F5',
      itemColor: '#7F8C8D',
      itemSelectedColor: '#A8D8EA',
      itemHoverColor: '#2C3E50',
      titleFontSize: 14,
      cardHeight: 40,
      horizontalMargin: '0',
      cardPadding: '8px 16px',
    },
    Menu: {
      colorBgContainer: '#FFFFFF',
      colorItemBg: 'transparent',
      colorItemBgHover: '#F5F5F5',
      colorItemBgSelected: '#F5F5F5',
      colorItemText: '#2C3E50',
      colorItemTextHover: '#2C3E50',
      colorItemTextSelected: '#A8D8EA',
      borderRadius: 8,
      itemHeight: 40,
      itemPaddingInline: 16,
    },
    Dropdown: {
      colorBgElevated: '#FFFFFF',
      borderRadiusLG: 12,
      controlHeight: 40,
      fontSize: 14,
    },
    Avatar: {
      colorBgContainer: '#F5F5F5',
      colorText: '#2C3E50',
      borderRadius: 20,
    },
    Badge: {
      colorBgContainer: '#A8D8EA',
      colorText: '#2C3E50',
      dotSize: 8,
      textFontSize: 12,
    },
    Tag: {
      borderRadius: 8,
      fontSize: 12,
    },
    Message: {
      colorBgElevated: '#FFFFFF',
      borderRadiusLG: 12,
    },
    Notification: {
      colorBgElevated: '#FFFFFF',
      borderRadiusLG: 16,
      fontSize: 14,
    },
    Spin: {
      colorPrimary: '#A8D8EA',
    },
    Progress: {
      colorInfo: '#A8D8EA',
      colorSuccess: '#A8E6CF',
      colorWarning: '#FFD3B6',
      colorError: '#FFAAA5',
      defaultColor: '#F0F0F0',
    },
    DatePicker: {
      colorBgContainer: '#FFFFFF',
      colorBorder: '#E0E0E0',
      borderRadius: 12,
      controlHeight: 40,
    },
    Upload: {
      colorBgContainer: '#F5F5F5',
      colorBorder: '#E0E0E0',
      borderRadius: 16,
    },
    Tooltip: {
      colorBgElevated: '#2C3E50',
      colorText: '#FFFFFF',
      borderRadius: 8,
      fontSize: 12,
    },
    Popover: {
      colorBgElevated: '#FFFFFF',
      borderRadiusLG: 12,
      fontSize: 14,
    },
    Alert: {
      borderRadius: 12,
      fontSize: 14,
    },
  },
};