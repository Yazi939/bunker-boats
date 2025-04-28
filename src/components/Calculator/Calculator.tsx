import React, { useState } from 'react';
import { Card, Input, Button, Checkbox, Tabs, Space, Alert } from 'antd';
import type { TabsProps } from 'antd';

const Calculator: React.FC = () => {
  // Общие состояния
  const [distance, setDistance] = useState<string>('');
  const [fuelPrice, setFuelPrice] = useState<string>('');
  const [roundTrip, setRoundTrip] = useState<boolean>(false);
  const [result, setResult] = useState<{
    totalDistance: number;
    fuelAmount: number;
    totalCost: number;
    travelTime?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Состояния для наземного транспорта
  const [fuelConsumption, setFuelConsumption] = useState<string>('');

  // Состояния для водного транспорта
  const [speedWater, setSpeedWater] = useState<string>('');
  const [hourlyConsumption, setHourlyConsumption] = useState<string>('');

  const handleCalculateLand = () => {
    setError(null);
    
    const distanceNum = parseFloat(distance);
    const consumptionNum = parseFloat(fuelConsumption);
    const priceNum = parseFloat(fuelPrice);
    
    if (isNaN(distanceNum) || isNaN(consumptionNum) || isNaN(priceNum)) {
      setError('Пожалуйста, заполните все поля корректными числовыми значениями');
      return;
    }
    
    if (distanceNum <= 0 || consumptionNum <= 0 || priceNum <= 0) {
      setError('Все значения должны быть больше нуля');
      return;
    }
    
    const totalDistance = roundTrip ? distanceNum * 2 : distanceNum;
    const fuelAmount = (totalDistance * consumptionNum) / 100;
    const totalCost = fuelAmount * priceNum;
    
    setResult({
      totalDistance,
      fuelAmount,
      totalCost
    });
  };

  const handleCalculateWater = () => {
    setError(null);
    
    const distanceNum = parseFloat(distance);
    const speedNum = parseFloat(speedWater);
    const hourlyConsumptionNum = parseFloat(hourlyConsumption);
    const priceNum = parseFloat(fuelPrice);
    
    if (isNaN(distanceNum) || isNaN(speedNum) || isNaN(hourlyConsumptionNum) || isNaN(priceNum)) {
      setError('Пожалуйста, заполните все поля корректными числовыми значениями');
      return;
    }
    
    if (distanceNum <= 0 || speedNum <= 0 || hourlyConsumptionNum <= 0 || priceNum <= 0) {
      setError('Все значения должны быть больше нуля');
      return;
    }
    
    const totalDistance = roundTrip ? distanceNum * 2 : distanceNum;
    const travelTimeHours = totalDistance / speedNum;
    const fuelAmount = hourlyConsumptionNum * travelTimeHours;
    const totalCost = fuelAmount * priceNum;
    
    setResult({
      totalDistance,
      fuelAmount,
      totalCost,
      travelTime: travelTimeHours
    });
  };

  const formatTime = (hours: number): string => {
    if (hours < 1) {
      return Math.round(hours * 60) + ' мин';
    }
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return wholeHours + ' ч ' + (minutes > 0 ? minutes + ' мин' : '');
  };

  const items: TabsProps['items'] = [
    {
      key: 'land',
      label: (
        <span>
          🚗 Наземный транспорт
        </span>
      ),
      children: (
        <Card>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <div>Расстояние</div>
              <Input
                placeholder="Введите расстояние"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                suffix="в километрах"
                type="number"
                min="0"
              />
            </div>
            
            <div>
              <div>Расход топлива</div>
              <Input
                placeholder="Введите расход топлива"
                value={fuelConsumption}
                onChange={(e) => setFuelConsumption(e.target.value)}
                suffix="л/100км"
                type="number"
                min="0"
                step="0.1"
              />
            </div>
            
            <div>
              <div>Цена топлива</div>
              <Input
                placeholder="Введите цену топлива"
                value={fuelPrice}
                onChange={(e) => setFuelPrice(e.target.value)}
                suffix="₽/л"
                type="number"
                min="0"
                step="0.1"
              />
            </div>
            
            <Checkbox checked={roundTrip} onChange={(e) => setRoundTrip(e.target.checked)}>
              Учитывать обратный путь
            </Checkbox>
            
            <Button type="primary" block onClick={handleCalculateLand}>
              Рассчитать
            </Button>
            
            {error && (
              <Alert message={error} type="error" showIcon />
            )}
            
            {result && (
              <Card title="Результаты расчета" style={{ marginTop: 16 }}>
                <p><strong>Расстояние:</strong> {result.totalDistance.toFixed(1)} км</p>
                <p><strong>Необходимое количество топлива:</strong> {result.fuelAmount.toFixed(2)} л</p>
                <p><strong>Стоимость поездки:</strong> {result.totalCost.toFixed(2)} ₽</p>
              </Card>
            )}
          </Space>
        </Card>
      ),
    },
    {
      key: 'water',
      label: (
        <span>
          ⛵ Водный транспорт
        </span>
      ),
      children: (
        <Card>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <div>Расстояние</div>
              <Input
                placeholder="Введите расстояние"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                suffix="в километрах"
                type="number"
                min="0"
              />
            </div>
            
            <div>
              <div>Скорость судна</div>
              <Input
                placeholder="Введите скорость"
                value={speedWater}
                onChange={(e) => setSpeedWater(e.target.value)}
                suffix="км/ч"
                type="number"
                min="0"
                step="0.1"
              />
            </div>
            
            <div>
              <div>Расход топлива в час</div>
              <Input
                placeholder="Введите расход топлива"
                value={hourlyConsumption}
                onChange={(e) => setHourlyConsumption(e.target.value)}
                suffix="л/час"
                type="number"
                min="0"
                step="0.1"
              />
            </div>
            
            <div>
              <div>Цена топлива</div>
              <Input
                placeholder="Введите цену топлива"
                value={fuelPrice}
                onChange={(e) => setFuelPrice(e.target.value)}
                suffix="₽/л"
                type="number"
                min="0"
                step="0.1"
              />
            </div>
            
            <Checkbox checked={roundTrip} onChange={(e) => setRoundTrip(e.target.checked)}>
              Учитывать обратный путь
            </Checkbox>
            
            <Button type="primary" block onClick={handleCalculateWater}>
              Рассчитать
            </Button>
            
            {error && (
              <Alert message={error} type="error" showIcon />
            )}
            
            {result && (
              <Card title="Результаты расчета" style={{ marginTop: 16 }}>
                <p><strong>Расстояние:</strong> {result.totalDistance.toFixed(1)} км</p>
                {result.travelTime && (
                  <p><strong>Время в пути:</strong> {formatTime(result.travelTime)}</p>
                )}
                <p><strong>Необходимое количество топлива:</strong> {result.fuelAmount.toFixed(2)} л</p>
                <p><strong>Стоимость поездки:</strong> {result.totalCost.toFixed(2)} ₽</p>
              </Card>
            )}
          </Space>
        </Card>
      )
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1>Калькулятор расхода топлива</h1>
      <Tabs defaultActiveKey="land" items={items} />
    </div>
  );
};

export default Calculator;