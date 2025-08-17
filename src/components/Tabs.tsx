import React, { ReactNode } from 'react';
import Icon from './Icon';

interface Tab {
  id: string;
  label: string;
  icon?: string;
  component: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const Tabs = ({ tabs, activeTab, setActiveTab }: TabsProps) => {
  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="tabs-container">
      <nav className="tabs-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
          >
            {tab.icon && <Icon path={tab.icon} className="icon" />}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
      <div className="tab-content" role="tabpanel">
        {activeTabContent}
      </div>
    </div>
  );
};

export default Tabs;
