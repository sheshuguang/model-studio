/**
 * Copyright (c) 2020-present, Goldman Sachs
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export const Mocked_ModelCoverageAnalyticsResult_ComplexM2MModel = {
  mappedEntities: [
    {
      path: 'model::target::NFirm',
      properties: [
        {
          _type: 'entity',
          entityPath: 'model::target::NPerson',
          name: 'nEmployees',
        },
        {
          _type: 'enum',
          enumPath: 'model::target::IncType',
          name: 'incType',
        },
        {
          _type: 'MappedProperty',
          name: 'name',
        },
        {
          _type: 'entity',
          entityPath: 'model::target::NPerson',
          name: 'firstEmployee',
        },
        {
          _type: 'MappedProperty',
          name: 'myName',
        },
      ],
    },
    {
      path: 'model::target::NPerson',
      properties: [
        {
          _type: 'MappedProperty',
          name: 'fullName',
        },
      ],
    },
  ],
};

export const Mocked_ModelCoverageAnalyticsResult_COVIDDataSimpleModel = {
  mappedEntities: [
    {
      path: 'domain::Demographics',
      properties: [
        {
          _type: 'MappedProperty',
          name: 'state',
        },
        {
          _type: 'MappedProperty',
          name: 'fips',
        },
      ],
    },
    {
      path: 'domain::COVIDData',
      properties: [
        {
          _type: 'MappedProperty',
          name: 'caseType',
        },
        {
          _type: 'MappedProperty',
          name: 'lastReportedFlag',
        },
        {
          _type: 'entity',
          entityPath: 'domain::Demographics',
          name: 'demographics',
        },
        {
          _type: 'MappedProperty',
          name: 'id',
        },
        {
          _type: 'MappedProperty',
          name: 'date',
        },
        {
          _type: 'MappedProperty',
          name: 'fips',
        },
        {
          _type: 'MappedProperty',
          name: 'cases',
        },
      ],
    },
  ],
};

export const Mocked_ModelCoverageAnalyticsResult_Auto_M2M = {
  mappedEntities: [
    {
      path: 'test::autoMapping::Firm',
      properties: [
        {
          _type: 'MappedProperty',
          name: 'name',
        },
        {
          _type: 'MappedProperty',
          name: 'location',
        },
      ],
    },
  ],
};

export const Mocked_ModelCoverageAnalyticsResult_Relational_Inline = {
  mappedEntities: [
    {
      path: 'Oct::models::Firm',
      properties: [
        {
          _type: 'MappedProperty',
          name: 'name',
        },
        {
          _type: 'MappedProperty',
          name: 'id',
        },
      ],
    },
    {
      path: 'Oct::models::Person',
      properties: [
        {
          _type: 'MappedProperty',
          name: 'fName',
        },
        {
          _type: 'entity',
          entityPath: 'Oct::models::Firm',
          name: 'firm',
        },
      ],
    },
  ],
};

export const Mocked_ModelCoverageAnalyticsResult_SimpleRelationalInheritanceModel =
  {
    mappedEntities: [
      {
        path: 'model::Firm',
        properties: [
          {
            _type: 'entity',
            entityPath: 'model::Person',
            name: 'employees',
          },
          {
            _type: 'MappedProperty',
            name: 'legalName',
          },
          {
            _type: 'MappedProperty',
            name: 'employeeSize',
          },
        ],
      },
      {
        path: 'model::LegalEntity',
        properties: [
          {
            _type: 'MappedProperty',
            name: 'legalName',
          },
        ],
      },
      {
        path: 'model::Person',
        properties: [
          {
            _type: 'MappedProperty',
            name: 'lastName',
          },
          {
            _type: 'MappedProperty',
            name: 'firstName',
          },
        ],
      },
    ],
  };

export const Mocked_ModelCoverageAnalyticsResult_AssociationMappingModel = {
  mappedEntities: [
    {
      path: 'model::Person',
      properties: [
        {
          _type: 'entity',
          entityPath: 'model::Firm',
          name: 'firm',
        },
        {
          _type: 'MappedProperty',
          name: 'lastName',
        },
        {
          _type: 'MappedProperty',
          name: 'firstName',
        },
      ],
    },
    {
      path: 'model::Firm',
      properties: [
        {
          _type: 'MappedProperty',
          name: 'name',
        },
        {
          _type: 'entity',
          entityPath: 'model::Person',
          name: 'employee',
        },
      ],
    },
  ],
};

export const Mocked_ModelCoverageAnalyticsResult_ComplexRelationalModel = {
  mappedEntities: [
    {
      path: 'model::pure::tests::model::simple::PersonExtension',
      properties: [
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Person',
          name: 'manager',
        },
        {
          _type: 'MappedProperty',
          name: 'birthdate',
        },
        {
          _type: 'MappedProperty',
          name: 'firstName',
        },
        {
          _type: 'MappedProperty',
          name: 'lastName',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Location',
          name: 'locations',
        },
        {
          _type: 'MappedProperty',
          name: 'age',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Firm',
          name: 'firm',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Address',
          name: 'address',
        },
        {
          _type: 'MappedProperty',
          name: 'birthYear',
        },
        {
          _type: 'MappedProperty',
          name: 'name',
        },
        {
          _type: 'MappedProperty',
          name: 'nameWithTitle',
        },
        {
          _type: 'MappedProperty',
          name: 'nameWithPrefixAndSuffix',
        },
        {
          _type: 'MappedProperty',
          name: 'fullName',
        },
        {
          _type: 'MappedProperty',
          name: 'constant',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Address',
          name: 'addresses',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Location',
          name: 'locationsByType',
        },
      ],
    },
    {
      path: 'model::pure::tests::model::simple::FirmExtension',
      properties: [
        {
          _type: 'MappedProperty',
          name: 'legalName',
        },
        {
          _type: 'MappedProperty',
          name: 'establishedDate',
        },
        {
          _type: 'entity',
          entityPath:
            'model_pure_tests_model_simple_FirmExtension_employeesExt',
          name: 'employeesExt',
        },
        {
          _type: 'MappedProperty',
          name: 'establishedYear',
        },
        {
          _type: 'MappedProperty',
          name: 'allEmployeesLastName',
        },
        {
          _type: 'MappedProperty',
          name: 'averageEmployeesAge',
        },
        {
          _type: 'MappedProperty',
          name: 'sumEmployeesAge',
        },
        {
          _type: 'MappedProperty',
          name: 'maxEmployeesAge',
        },
        {
          _type: 'MappedProperty',
          name: 'nameAndAddress',
        },
        {
          _type: 'MappedProperty',
          name: 'isfirmX',
        },
        {
          _type: 'MappedProperty',
          name: 'nameAndMaskedAddress',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Person',
          name: 'employeeByLastName',
        },
        {
          _type: 'MappedProperty',
          name: 'employeeByLastNameFirstName',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Person',
          name: 'employeeByLastNameWhereVarIsFirstEqualArg',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Person',
          name: 'employeesByAge',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Person',
          name: 'employeesByCityOrManager',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Person',
          name: 'employeesByCityOrManagerAndLastName',
        },
        {
          _type: 'MappedProperty',
          name: 'hasEmployeeBelowAge',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Person',
          name: 'employeeWithFirmAddressName',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Person',
          name: 'employeeWithAddressName',
        },
        {
          _type: 'MappedProperty',
          name: 'employeesWithAddressNameSorted',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Address',
          name: 'employeeAddressesWithFirmAddressName',
        },
        {
          _type: 'MappedProperty',
          name: 'isfirmXGroup',
        },
      ],
    },
    {
      name: 'model::pure::tests::model::simple::TradeEvent',
      properties: [
        {
          _type: 'MappedProperty',
          name: 'eventType',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Person',
          name: 'initiator',
        },
        {
          _type: 'MappedProperty',
          name: 'traderAddress',
        },
        {
          _type: 'MappedProperty',
          name: 'date',
        },
      ],
    },
    {
      path: 'model::pure::tests::model::simple::Synonym',
      properties: [
        {
          _type: 'enum',
          enumPath: 'model::pure::tests::model::simple::ProductSynonymType',
          name: 'type',
        },
        {
          _type: 'MappedProperty',
          name: 'name',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Product',
          name: 'product',
        },
        {
          _type: 'MappedProperty',
          name: 'typeAsString',
        },
      ],
    },
    {
      path: 'model::pure::tests::model::simple::Interaction',
      properties: [
        {
          _type: 'MappedProperty',
          name: 'time',
        },
        {
          _type: 'MappedProperty',
          name: 'id',
        },
        {
          _type: 'MappedProperty',
          name: 'longestInteractionBetweenSourceAndTarget',
        },
        {
          _type: 'MappedProperty',
          name: 'active',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Person',
          name: 'target',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Person',
          name: 'source',
        },
      ],
    },
    {
      path: 'model::pure::tests::model::simple::Person',
      properties: [
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Person',
          name: 'manager',
        },
        {
          _type: 'MappedProperty',
          name: 'firstName',
        },
        {
          _type: 'MappedProperty',
          name: 'lastName',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Location',
          name: 'locations',
        },
        {
          _type: 'MappedProperty',
          name: 'age',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Firm',
          name: 'firm',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Address',
          name: 'address',
        },
        {
          _type: 'MappedProperty',
          name: 'name',
        },
        {
          _type: 'MappedProperty',
          name: 'nameWithTitle',
        },
        {
          _type: 'MappedProperty',
          name: 'nameWithPrefixAndSuffix',
        },
        {
          _type: 'MappedProperty',
          name: 'fullName',
        },
        {
          _type: 'MappedProperty',
          name: 'constant',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Address',
          name: 'addresses',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Location',
          name: 'locationsByType',
        },
      ],
    },
    {
      name: 'model::pure::tests::model::simple::Order',
      properties: [
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Person',
          name: 'pnlContact',
        },
        {
          _type: 'MappedProperty',
          name: 'settlementDateTime',
        },
        {
          _type: 'MappedProperty',
          name: 'id',
        },
        {
          _type: 'MappedProperty',
          name: 'date',
        },
        {
          _type: 'MappedProperty',
          name: 'quantity',
        },
        {
          _type: 'MappedProperty',
          name: 'zeroPnl',
        },
        {
          _type: 'MappedProperty',
          name: 'pnl',
        },
      ],
    },
    {
      path: 'model::pure::tests::model::simple::Trade',
      properties: [
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Account',
          name: 'account',
        },
        {
          _type: 'MappedProperty',
          name: 'settlementDateTime',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Product',
          name: 'product',
        },
        {
          _type: 'MappedProperty',
          name: 'quantity',
        },
        {
          _type: 'MappedProperty',
          name: 'id',
        },
        {
          _type: 'MappedProperty',
          name: 'date',
        },
        {
          _type: 'MappedProperty',
          name: 'latestEventDate',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::TradeEvent',
          name: 'events',
        },
        {
          _type: 'MappedProperty',
          name: 'productIdentifier',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Product',
          name: 'filterProductByNameAndTradeDate',
        },
        {
          _type: 'MappedProperty',
          name: 'classificationType',
        },
        {
          _type: 'MappedProperty',
          name: 'productDescription',
        },
        {
          _type: 'MappedProperty',
          name: 'accountDescription',
        },
        {
          _type: 'MappedProperty',
          name: 'productIdentifierWithNull',
        },
        {
          _type: 'MappedProperty',
          name: 'customerQuantity',
        },
        {
          _type: 'MappedProperty',
          name: 'daysToLastEvent',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::TradeEvent',
          name: 'latestEvent',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::TradeEvent',
          name: 'eventsByDate',
        },
        {
          _type: 'MappedProperty',
          name: 'tradeDateEventType',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::TradeEvent',
          name: 'tradeDateEvent',
        },
        {
          _type: 'MappedProperty',
          name: 'tradeDateEventTypeInlined',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Person',
          name: 'initiator',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Person',
          name: 'initiatorInlined',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Person',
          name: 'initiatorInlinedByProductName',
        },
      ],
    },
    {
      name: 'model::pure::tests::model::simple::Location',
      properties: [
        {
          _type: 'MappedProperty',
          name: 'censusdate',
        },
        {
          _type: 'MappedProperty',
          name: 'place',
        },
      ],
    },
    {
      path: 'model::pure::tests::model::simple::PlaceOfInterest',
      properties: [
        {
          _type: 'MappedProperty',
          name: 'name',
        },
      ],
    },
    {
      path: 'model::pure::tests::model::simple::Firm',
      properties: [
        {
          _type: 'MappedProperty',
          name: 'legalName',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Person',
          name: 'employees',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Address',
          name: 'address',
        },
        {
          _type: 'MappedProperty',
          name: 'averageEmployeesAge',
        },
        {
          _type: 'MappedProperty',
          name: 'sumEmployeesAge',
        },
        {
          _type: 'MappedProperty',
          name: 'maxEmployeesAge',
        },
        {
          _type: 'MappedProperty',
          name: 'nameAndAddress',
        },
        {
          _type: 'MappedProperty',
          name: 'isfirmX',
        },
        {
          _type: 'MappedProperty',
          name: 'nameAndMaskedAddress',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Person',
          name: 'employeeByLastName',
        },
        {
          _type: 'MappedProperty',
          name: 'employeeByLastNameFirstName',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Person',
          name: 'employeeByLastNameWhereVarIsFirstEqualArg',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Person',
          name: 'employeesByAge',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Person',
          name: 'employeesByCityOrManager',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Person',
          name: 'employeesByCityOrManagerAndLastName',
        },
        {
          _type: 'MappedProperty',
          name: 'hasEmployeeBelowAge',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Person',
          name: 'employeeWithFirmAddressName',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Person',
          name: 'employeeWithAddressName',
        },
        {
          _type: 'MappedProperty',
          name: 'employeesWithAddressNameSorted',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Address',
          name: 'employeeAddressesWithFirmAddressName',
        },
        {
          _type: 'MappedProperty',
          name: 'isfirmXGroup',
        },
      ],
    },
    {
      path: 'model::pure::tests::model::simple::OrderPnl',
      properties: [
        {
          _type: 'MappedProperty',
          name: 'supportContactName',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Order',
          name: 'order',
        },
        {
          _type: 'MappedProperty',
          name: 'pnl',
        },
      ],
    },
    {
      path: 'model::pure::tests::model::simple::Product',
      properties: [
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Synonym',
          name: 'synonyms',
        },
        {
          _type: 'MappedProperty',
          name: 'name',
        },
        {
          _type: 'MappedProperty',
          name: 'cusip',
        },
        {
          _type: 'MappedProperty',
          name: 'isin',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Synonym',
          name: 'cusipSynonym',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Synonym',
          name: 'isinSynonym',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Synonym',
          name: 'synonymByType',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Synonym',
          name: 'synonymsByTypes',
        },
      ],
    },
    {
      path: 'model::pure::tests::model::simple::AccountPnl',
      properties: [
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Account',
          name: 'account',
        },
        {
          _type: 'MappedProperty',
          name: 'pnl',
        },
      ],
    },
    {
      path: 'model::pure::tests::model::simple::Address',
      properties: [
        {
          _type: 'MappedProperty',
          name: 'name',
        },
        {
          _type: 'MappedProperty',
          name: 'street',
        },
        {
          _type: 'MappedProperty',
          name: 'comments',
        },
        {
          _type: 'enum',
          enumPath: 'model::pure::tests::model::simple::GeographicEntityType',
          name: 'type',
        },
        {
          _type: 'MappedProperty',
          name: 'description',
        },
      ],
    },
    {
      path: 'model::pure::tests::model::simple::Account',
      properties: [
        {
          _type: 'MappedProperty',
          name: 'createDate',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Trade',
          name: 'trades',
        },
        {
          _type: 'MappedProperty',
          name: 'name',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Order',
          name: 'orders',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::AccountPnl',
          name: 'accountPnl',
        },
        {
          _type: 'MappedProperty',
          name: 'accountCategory',
        },
        {
          _type: 'MappedProperty',
          name: 'isTypeA',
        },
      ],
    },
    {
      path: 'model_pure_tests_model_simple_FirmExtension_employeesExt',
      properties: [
        {
          _type: 'MappedProperty',
          name: 'birthdate',
        },
        {
          _type: 'MappedProperty',
          name: 'birthYear',
        },
        {
          _type: 'MappedProperty',
          name: 'name',
        },
        {
          _type: 'MappedProperty',
          name: 'nameWithTitle',
        },
        {
          _type: 'MappedProperty',
          name: 'nameWithPrefixAndSuffix',
        },
        {
          _type: 'MappedProperty',
          name: 'fullName',
        },
        {
          _type: 'MappedProperty',
          name: 'constant',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Address',
          name: 'addresses',
        },
        {
          _type: 'entity',
          entityPath: 'model::pure::tests::model::simple::Location',
          name: 'locationsByType',
        },
      ],
    },
  ],
};

export const Mocked_ModelCoverageAnalyticsResult_SimpleSubtype = {
  mappedEntities: [
    {
      path: 'model::LegalEntity',
      properties: [
        {
          _type: 'entity',
          entityPath: 'model::Person',
          name: 'employees',
        },
        {
          _type: 'entity',
          entityPath: '@model::Firm',
          name: 'firm',
          subType: 'model::Firm',
        },
      ],
    },
    {
      path: '@model::Firm',
      properties: [
        {
          _type: 'entity',
          entityPath: 'model::Person',
          name: 'employees',
        },
      ],
    },
    {
      path: 'model::Firm',
      properties: [
        {
          _type: 'entity',
          entityPath: 'model::Person',
          name: 'employees',
        },
      ],
    },
    {
      path: 'model::Person',
      properties: [
        {
          _type: 'MappedProperty',
          name: 'lastName',
        },
        {
          _type: 'MappedProperty',
          name: 'firstName',
        },
      ],
    },
  ],
};

export const Mocked_ModelCoverageAnalyticsResult_SimpleRelationalModel = {
  mappedEntities: [
    {
      path: 'my::Firm',
      properties: [
        { _type: 'MappedProperty', name: 'legalName' },
        { _type: 'entity', entityPath: 'my::Person', name: 'employees' },
        { _type: 'MappedProperty', name: 'id' },
      ],
    },
    {
      path: 'my::Person',
      properties: [
        { _type: 'MappedProperty', name: 'age' },
        { _type: 'MappedProperty', name: 'firmID' },
        { _type: 'MappedProperty', name: 'lastName' },
        { _type: 'MappedProperty', name: 'firstName' },
        { _type: 'MappedProperty', name: 'hobbies' },
      ],
    },
  ],
};
