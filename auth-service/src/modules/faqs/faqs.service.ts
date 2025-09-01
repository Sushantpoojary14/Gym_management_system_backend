import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Faq } from './entities/faq.entity';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { CategoryFaq } from 'src/common/enums/categoryFaq.enum';

@Injectable()
export class FaqsService {
  constructor(
    @InjectRepository(Faq)
    private faqRepository: Repository<Faq>,
  ) {}

  async create(createFaqDto: CreateFaqDto): Promise<Faq> {
    const { question,answer,category,isPopular } = createFaqDto;
    const faq = this.faqRepository.create({ question,answer,category,isPopular });
    return await this.faqRepository.save(faq);
  }

  async findAll(): Promise<any> {
    const faqs= await this.faqRepository.find();
    const grouped = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
      acc[faq.category].push(faq);
      return acc;
    }, {} as Record<string, Faq[]>);

    return grouped;
  }

  async findPopular(): Promise<Faq[]> {
    return await this.faqRepository.find({ where: { isPopular: true } });
  }

  async update(id: number, updateFaqDto: UpdateFaqDto): Promise<Faq> {
    const { question, answer, category, isPopular } = updateFaqDto;
    const faq = await this.faqRepository.findOne({ where: { id } });
    if(!faq){
      throw new NotFoundException('FAQ not found');
    }
    
    if(question) faq.question = question;
    if(answer) faq.answer = answer;
    if(category) faq.category = category;
    if(isPopular!==undefined) faq.isPopular = isPopular;
    return await this.faqRepository.save(faq);
  }

  async remove(id: number): Promise<string> {
    const result = await this.faqRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('FAQ not found');
    }
    return "FAQ removed successfully";
  }
}