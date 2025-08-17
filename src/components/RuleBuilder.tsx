import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon, { ICONS } from './Icon';

const RULE_FIELDS = [
    {
        label: 'general', type: 'category',
        options: [
            'Firstname', 'Lastname', 'ListName', 'Status', 'Source', 'UnsubscribeReason', 'Email',
            'DateAdded', 'DateUpdated', 'StatusChangeDate', 'ConsentDate', 'ConsentIp', 'ConsentTracking',
            'DaysSinceDateAdded', 'DaysSinceDateUpdated', 'DaysSinceConsentDate', 'CreatedFromIp', 'LastError'
        ]
    },
    {
        label: 'statistics', type: 'category',
        options: [
            'TotalSent', 'TotalOpens', 'TotalClicks', 'TotalBounces',
            'LastSent', 'LastOpened', 'LastClicked', 'LastBounced',
            'DaysSinceLastSent', 'DaysSinceLastOpened', 'DaysSinceLastClicked', 'DaysSinceLastBounced'
        ]
    },
    {
        label: 'custom', type: 'category',
        options: [
            'Country', 'Mobile', 'Phone', 'Company' // Common custom fields
        ]
    }
];

const OPERATORS = {
    string: ['=', 'CONTAINS', 'NOTCONTAINS', 'STARTSWITH', 'ENDSWITH', 'ISEMPTY', 'ISNOTEMPTY'],
    number: ['=', '>', '<', '>=', '<='],
    date: ['Before', 'After'],
    boolean: ['=']
};

const FIELD_TYPES: Record<string, keyof typeof OPERATORS> = {
    DateAdded: 'date', DateUpdated: 'date', StatusChangeDate: 'date', ConsentDate: 'date',
    LastSent: 'date', LastOpened: 'date', LastClicked: 'date', LastBounced: 'date',
    DaysSinceDateAdded: 'number', DaysSinceDateUpdated: 'number', DaysSinceConsentDate: 'number',
    TotalSent: 'number', TotalOpens: 'number', TotalClicks: 'number', TotalBounces: 'number',
    ConsentTracking: 'boolean',
};

const getOperatorsForField = (field: string) => {
    const type = FIELD_TYPES[field] || 'string';
    return OPERATORS[type];
};

const operatorRequiresValue = (operator: string) => {
    return operator !== 'ISEMPTY' && operator !== 'ISNOTEMPTY';
};


const RuleBuilder = ({ rules, setRules, conjunction, setConjunction }: { rules: any[]; setRules: Function; conjunction: string; setConjunction: Function }) => {
    const { t } = useTranslation();

    const updateRule = (index: number, field: string, value: any) => {
        const newRules = [...rules];
        newRules[index][field] = value;
        // If field changes, reset operator and value
        if (field === 'Field') {
            newRules[index].Operator = getOperatorsForField(value)[0];
            newRules[index].Value = '';
        }
        setRules(newRules);
    };

    const addRule = () => {
        setRules([...rules, { Field: 'Email', Operator: 'CONTAINS', Value: '' }]);
    };

    const removeRule = (index: number) => {
        setRules(rules.filter((_, i) => i !== index));
    };

    return (
        <div className="rule-builder">
            <div className="rule-conjunction-toggle">
                <span>{t('match')}</span>
                <button type="button" onClick={() => setConjunction('AND')} className={conjunction === 'AND' ? 'active' : ''}>{t('allAnd')}</button>
                <span>{t('ofTheFollowing')}</span>
            </div>
            <div className="rule-list">
                {rules.map((rule, index) => (
                    <div key={index} className="rule-row">
                        <select value={rule.Field} onChange={(e) => updateRule(index, 'Field', e.target.value)}>
                           {RULE_FIELDS.map(group => (
                                <optgroup key={group.label} label={t(`segmentFieldCategory_${group.label}`)}>
                                    {group.options.map(field => (
                                        <option key={field} value={field}>{t(`segmentField_${field}`)}</option>
                                    ))}
                                </optgroup>
                           ))}
                        </select>
                        <select value={rule.Operator} onChange={(e) => updateRule(index, 'Operator', e.target.value)}>
                           {getOperatorsForField(rule.Field).map(op => (
                               <option key={op} value={op}>{t(`segmentOperator_${op}`)}</option>
                           ))}
                        </select>
                         <input
                            type={FIELD_TYPES[rule.Field] === 'date' ? 'date' : FIELD_TYPES[rule.Field] === 'number' ? 'number' : 'text'}
                            value={rule.Value}
                            onChange={(e) => updateRule(index, 'Value', e.target.value)}
                            placeholder={t('enterValue')}
                            disabled={!operatorRequiresValue(rule.Operator)}
                            aria-label="Rule value"
                        />
                         <button type="button" className="btn-icon btn-icon-danger remove-rule-btn" onClick={() => removeRule(index)}>
                            <Icon path={ICONS.DELETE} />
                        </button>
                    </div>
                ))}
            </div>
            <div className="add-rule-btn-container">
                <button type="button" className="btn add-rule-btn" onClick={addRule}>
                    <Icon path={ICONS.PLUS} /> {t('addAnotherRule')}
                </button>
            </div>
        </div>
    );
};

export default RuleBuilder;
